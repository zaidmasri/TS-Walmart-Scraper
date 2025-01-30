import { ItemModel } from "./productModel.js";
import { Labels } from "./labels.js";
import { RequestOptions } from "crawlee";

export interface IPaginationLimits {
  startPageNumber: number,
  finalPageNumber: number
}

export interface IPricingLimits {
  minPrice: number,
  maxPrice: number,
}

export interface IRequestBaseUserData { pagination?: IPaginationLimits, pricing?: IPricingLimits, sku?: string, pageNumber?: number, product?: ItemModel }

export type IBaseRequestOptions = RequestOptions<IRequestBaseUserData>

export interface IBaseRequestParams {
  url: string,
  sku?: string,
  pageNumber?: number,
  pagination?: IPaginationLimits,
  pricing?: IPricingLimits,
  label?: Labels
  product?: ItemModel
}


function getRequest(
  {
    url,
    pagination,
    pricing,
    label,
    sku,
    pageNumber, product
  }: IBaseRequestParams
): IBaseRequestOptions {
  const finalRequest: IBaseRequestOptions = {
    url,
    label,
    userData: { pagination, pricing, sku, pageNumber, product },
  };

  const isProduct = url.includes("/ip/");
  const isCategory = url.includes("/browse/");
  const isBrand = url.includes("/brand/");
  const isReview = url.includes("/reviews/");
  const isKeyword = url.includes("search?q=");

  /*****************************************************************/

  if (isProduct) {
    finalRequest.label = Labels.Detail;
  } else if (isReview) {
    finalRequest.label = Labels.Review
  } else if (isCategory || isKeyword || isBrand) {
    finalRequest.label = Labels.Listing;
  }

  return finalRequest;
}

export { getRequest };
