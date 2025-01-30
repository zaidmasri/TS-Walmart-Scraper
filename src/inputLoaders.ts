import { Dataset, DatasetContent, RequestQueue, log } from "crawlee";
import { getRequest } from "./requestGenerator.js";
import { Labels } from "./labels.js";
import { ItemModel } from "./productModel.js";
import { baseUrl } from "./main.js";

async function loadInputUrls(
  urls: string[],
  pagination?: { startPageNumber: number; finalPageNumber: number },
  pricing?: { minPrice: number; maxPrice: number },
  label?: Labels
) {
  const requestQueue = await RequestQueue.open();

  for (let url of urls) {
    const request = getRequest({ url, pagination, pricing, label });
    await requestQueue.addRequest(request);
  }
}

async function loadInputKeywords(
  keywords: string[],
  pagination: { startPageNumber: number; finalPageNumber: number },
  pricing: { minPrice: number; maxPrice: number },
  label?: Labels
) {
  const requestQueue = await RequestQueue.open();

  const newUrl = new URL("https://www.walmart.com/search");

  for (const keyword of keywords) {
    newUrl.searchParams.set("q", keyword);
    const request = getRequest({ url: newUrl.href, pagination, pricing, label });
    await requestQueue.addRequest(request);
  }
}
/**
 * This method will load the default dataset which contains product details scraped in previous runs.
 * 
 * @param pagination 
 * @param label 
 * @returns 
 */
async function loadInputReviewUrls(
) {
  const productDetailsDataset: DatasetContent<ItemModel> = await Dataset.getData()
  const requestQueue = await RequestQueue.open('reviews');
  for (const product of productDetailsDataset.items) {
    const sku = product.idCodes.SKU
    if (!sku) {
      log.error("Can't load review url due to missing sku, skipping", product)
      return;
    }
    const url = new URL(`${baseUrl}reviews/product/${sku}`)
    const pageNumber = 1
    url.searchParams.set("page", pageNumber.toString())
    const request = getRequest({ url: url.href, sku, pageNumber, product, pagination: undefined, pricing: undefined, label: undefined })
    await requestQueue.addRequest(request)
  }
}

export { loadInputKeywords, loadInputUrls, loadInputReviewUrls };
