import {
  log,
  RequestQueue,
  KeyValueStore,
  ProxyConfiguration,
  PuppeteerCrawler,
  PuppeteerCrawlerOptions,
  StorageManager,
  Dataset,
} from "crawlee";
import { loadInputKeywords, loadInputUrls, loadInputReviewUrls } from "./inputLoaders.js";
import { router } from "./routes.js";

interface InputSchema {
  productUrls: string[];
  listingUrls: string[];
  keywords: string[];
  startPageNumber: number;
  finalPageNumber: number;
  minPrice: number;
  maxPrice: number;
}

const {
  productUrls = [],
  listingUrls = [],
  keywords = [],
  startPageNumber = 0,
  finalPageNumber = 0,
  minPrice = 0,
  maxPrice = 0,
} = (await KeyValueStore.getInput<InputSchema>()) ?? {};

const baseUrl = "https://www.walmart.com/";

const pricing = { minPrice, maxPrice };
const pagination = { startPageNumber, finalPageNumber };

const requestQueue = await RequestQueue.open();

const crawlerOptions: PuppeteerCrawlerOptions = {
  requestQueue,
  requestHandler: router,
  maxConcurrency: 5,
  maxRequestRetries: 20,
  navigationTimeoutSecs: 90,
  requestHandlerTimeoutSecs: 90,
  headless: true,
  maxRequestsPerMinute: 100,

};

await loadInputUrls(productUrls, undefined, pricing);

await loadInputUrls(listingUrls, pagination, pricing);

await loadInputKeywords(keywords, pagination, pricing);

const crawler = new PuppeteerCrawler(crawlerOptions);

log.info("Starting the crawl.");
await crawler.run();
log.info("Crawl finished.");


await loadInputReviewUrls()
const useProxy = false;
if (useProxy) {
  const proxyConfiguration = new ProxyConfiguration({ proxyUrls: [] });
  Object.assign(crawlerOptions, { proxyConfiguration });
}


const reviewRequestQueue = await RequestQueue.open('reviews')
const reviewCrawler = new PuppeteerCrawler({ ...crawlerOptions, requestQueue: reviewRequestQueue })
log.info("Starting the review crawl.");
await reviewCrawler.run()
log.info("Review crawl finished.");
export { baseUrl };
