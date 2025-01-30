import { Dataset, RequestQueue, createPuppeteerRouter, log } from "crawlee";
import { exportItem } from "./itemExporters.js";
import { Labels } from "./labels.js";
import {
  getTotalPages,
  navigateAllPages,
  navigatePageRange,
  navigateToItemUrls,
} from "./listingNavigation.js";
import { isBlocked } from "./validations.js";
import { Page } from "puppeteer";
import { IReviewModel, IReview } from "./productModel.js";
import { IBaseRequestOptions, getRequest } from "./requestGenerator.js";
import { baseUrl } from "./main.js";

const DEFAULT_REVIEWS_PER_PAGE = 10;

export const router = createPuppeteerRouter();

router.addDefaultHandler(async ({ request }) => {
  log.error("Can't handle request, skipping", {
    label: request.label,
    url: request.url,
  });
});

router.addHandler(Labels.Listing, async ({ request, page }) => {
  log.info("Handling", { label: request.label, url: request.url });

  if (isBlocked(request.loadedUrl!)) throw new Error("Request blocked.");

  const listingData = await page.evaluate(() => {
    const nextDataElement = document.querySelector("#__NEXT_DATA__");
    return nextDataElement ? JSON.parse(nextDataElement.innerHTML) : null;
  });
  const pricing = request.userData.pricing;
  if (pricing.maxPrice < pricing.minPrice) {
    log.error(`Maximum Price should be greater or equal to Minimum Price.`);
    return;
  }

  const pagination = request.userData.pagination;
  if (pagination) {
    const startPage = pagination.startPageNumber;
    const finalPage = pagination.finalPageNumber;
    const triggerAllPages = startPage === 0 && finalPage === 0;
    const totalPages = getTotalPages(listingData);

    if (startPage > finalPage) {
      log.error("Start Page should be lesser or equal to Final Page");
      return;
    }

    if (finalPage > totalPages) {
      log.error(
        `Final Page should be less or equal to the total number of pages of this category: ${totalPages} pages`
      );
      return;
    }

    if (triggerAllPages) {
      await navigateAllPages(request.url, listingData, pricing);
    } else {
      await navigatePageRange(request.url, startPage, finalPage, pricing);
    }
  } else {
    await navigateToItemUrls(listingData, pricing);
  }
});

router.addHandler(Labels.Detail, async ({ request, page }) => {
  log.info("Handling", { label: request.label, url: request.url });

  if (isBlocked(request.loadedUrl!)) throw new Error("Request blocked.");

  const itemData = await page.evaluate(() => {
    const nextDataElement = document.querySelector("#__NEXT_DATA__");
    return nextDataElement ? JSON.parse(nextDataElement.innerHTML) : null;
  });
  const pricing = request.userData.pricing;

  await exportItem(request.url, itemData, pricing);
});

interface IWalmartBadge {
  id: string;
  badgeType: string;
  contentType: string;
  glassBadge: { id: string; text: string };
}

async function extractReviewsFromPage(
  page: Page,
  pageNumber: number
): Promise<IReviewModel> {
  const listingData = await page.evaluate(() => {
    const nextDataElement = document.querySelector("#__NEXT_DATA__");
    return nextDataElement ? JSON.parse(nextDataElement.innerHTML) : null;
  });

  const data = listingData.props.pageProps.initialData.data.reviews;
  const {
    pagination: { total },
    customerReviews,
    totalReviewCount,
  } = data;

  const maxNumberPages = Math.ceil(total / DEFAULT_REVIEWS_PER_PAGE);
  // @ts-ignore
  const reviews: IReview[] = customerReviews.map((review) => {
    const {
      reviewId,
      userNickname,
      authorId,
      rating,
      badges,
      reviewSubmissionTime,
      reviewTitle,
      reviewText,
      positiveFeedback,
      negativeFeedback,
      sellerName,
      features,
      fulfilledBy,
      clientResponses,
      syndicationSource,
      media,
      status,
    } = review;
    const parsedReview: IReview = {
      id: reviewId,
      author: {
        userNickname,
        authorId,
      },
      reviewSubmissionTime: new Date(reviewSubmissionTime),
      rating,
      isVerifiedPurchase:
        badges?.some(
          (badge: IWalmartBadge) => badge?.glassBadge?.id == "VerifiedPurchaser"
        ) ?? false,
      reviewText,
      reviewTitle,
      positiveFeedback,
      negativeFeedback,
      sellerName,
      features,
      fulfilledBy,
      isIncentivized:
        badges?.some((badge: IWalmartBadge) => badge?.id == "PrizeIncentive") ??
        false,
      clientResponses,
      isWalmartAssociate:
        badges?.some((badge: IWalmartBadge) => badge?.id == "Staff") ?? false,
      syndicationSource,
      media,
      status,
      isInternational:
        badges?.some(
          (badge: IWalmartBadge) =>
            badge?.glassBadge?.id == "InternationalReview"
        ) ?? false,
      url: page.url(),
      pageNumber,
    };
    return parsedReview;
  });
  log.debug('# of reviews found', {
    count: reviews.length,
  })
  const reviewModel: IReviewModel = {
    pagesCount: maxNumberPages,
    ratingCount: totalReviewCount,
    reviewCount: total,
    reviews,
  };

  return reviewModel;
}

router.addHandler(Labels.Review, async ({ request, page }) => {
  log.info("Handling", { label: request.label, url: request.url });
  if (isBlocked(request.loadedUrl!)) throw new Error("Request blocked.");
  const userData = request.userData as IBaseRequestOptions["userData"];
  if (!userData?.sku || !userData.pageNumber || !userData.product) {
    log.error("Missing sku or page number or product. skipping;", {
      label: request.label,
      userData,
      url: request.url,
    });
    return;
  }
  const { sku, pageNumber, product } = userData;
  if (!product.reviewsModel || !product.reviewsModel.reviews) {
    Object.assign(product, {
      reviewsModel: {
        pagesCount: -1,
        ratingCount: -1,
        reviewCount: -1,
        reviews: [],
      },
    });
  }
  const reviewsModel = await extractReviewsFromPage(page, pageNumber);

  const updatedProduct = {
    ...product,
    reviewsModel: {
      ...product.reviewsModel,
      ...reviewsModel,
      reviews: [...product.reviewsModel.reviews, ...reviewsModel.reviews],
    }, // TODO: This will be expensive, might have to refactor
  };

  const maxPageNumber = product.reviewsModel.pagesCount;

  if (pageNumber < maxPageNumber || maxPageNumber == -1) {
    const newPageNumber = pageNumber + 1;
    const newUrl = new URL(`${baseUrl}reviews/product/${sku}`);
    newUrl.searchParams.set("page", newPageNumber.toString());
    const request = getRequest({
      url: newUrl.href,
      pageNumber: newPageNumber,
      product: updatedProduct,
      sku,
    });
    const requestQueue = await RequestQueue.open("reviews");
    requestQueue.addRequest(request, { forefront: true });
    return;
  }

  log.info("extracting review data.", {
    pageNumber,
    maxPageNumber,
    product,
    sku,
  });
  const reviewsDataset = await Dataset.open("reviews");
  reviewsDataset.pushData(updatedProduct);
});
