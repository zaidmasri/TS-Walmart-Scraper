interface IIdCodes {
  SKU?: string;
  UPC?: string;
}

interface ISeller {
  brand?: string;
  brandURL?: string;
  seller?: string;
  sellerURL?: string;
}

interface IMedia {
  main?: string;
  gallery?: string[];
  videos?: { title?: string; url: string }[];
}

interface IPricing {
  salePrice: number;
  fullPrice?: number;
  currencySymbol?: string;
}

interface IAtribute {
  attribute: string;
  value: string;
}

interface ICategory {
  fullPath?: string;
  pathParts?: { name: string; url?: string }[];
}

interface IOrderLimit {
  min?: number;
  max?: number;
}

interface IInformational {
  shortDescription?: string;
  longDescription?: string;
  specifications?: IAtribute[];
}

interface IVariant {
  isCurrentVariant: boolean;
  url: string;
  SKU?: string;
  isAvailable: boolean;
  pricing: IPricing;
  options: IAtribute[];
}

interface IRating {
  itemReviews?: number;
  itemRating?: number;
  sellerReviews?: number;
  sellerRating?: number;
}
export interface IReview {
  id: string,
  author: {
    authorId: string,
    userNickname: string
  },
  reviewSubmissionTime: Date,
  rating: string,
  url: string,
  isVerifiedPurchase: boolean,
  reviewTitle: string | null,
  reviewText: string,
  positiveFeedback: number,
  negativeFeedback: number,
  sellerName: string | null,
  features: { name: string, value: string }[] | null,
  fulfilledBy: string | null,
  isIncentivized: boolean,
  clientResponses: {
    date: null | string,
    department: string,
    logoImage: string,
    name: string | null,
    response: string
  }[] | null
  isWalmartAssociate: boolean
  pageNumber: number,
  syndicationSource: {
    contentLink: string | null,
    logoImageUrl: string,
    name: string
  },
  media: {
    caption: string | null,
    id: string,
    mediaType: string,
    normalUrl: string,
    rating: number,
    reviewId: string,
    thumbnailUrl: string,
  }[] | null,
  status: string | null
  isInternational: boolean,
}
type IReviews = IReview[]

interface IReviewModel {
  pagesCount: number,
  ratingCount: number;
  reviewCount: number;
  reviews: IReviews;
}

class ProductModel {
  URL: string;
  idCodes: IIdCodes;
  seller: ISeller;
  title: string;
  media: IMedia;
  pricing: IPricing;
  isAvailable: boolean;
  isGiftEligible: boolean;
  isUsed: boolean;
  rating: IRating;
  orderLimits: IOrderLimit;
  category: ICategory;
  info: IInformational;
  variants: IVariant[];
  reviewsModel: IReviewModel;

  constructor() {
    this.URL = "";
    this.idCodes = {};
    this.seller = {};
    this.title = "";
    this.media = {};
    this.pricing = { salePrice: 0 };
    this.isAvailable = false;
    this.isGiftEligible = false;
    this.isUsed = false;
    this.rating = {};
    this.orderLimits = {};
    this.category = {};
    this.info = {};
    this.variants = [];
    this.reviewsModel = {
      pagesCount: -1,
      ratingCount: -1,
      reviewCount: -1,
      reviews: []
    };
  }
}

export {
  ProductModel as ItemModel,
  IIdCodes,
  ISeller,
  IMedia,
  IPricing,
  IAtribute,
  ICategory,
  IOrderLimit,
  IInformational,
  IVariant,
  IRating,
  IReviewModel
};
