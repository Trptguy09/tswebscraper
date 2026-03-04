import { JSDOM } from 'jsdom'
import pLimit from 'p-limit';

export function normalizeURL(input: string): string {
  if (!input || !input.trim()) {
    throw new Error("Invalid URL");
  }

  let url: URL;

  try {
    // Ensure protocol so URL constructor doesn't throw
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    throw new Error("Invalid URL");
  }

  // Lowercase hostname only
  const hostname = url.hostname.toLowerCase();

  // Remove default ports
  const isDefaultPort =
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443") ||
    url.port === "";

  const port = isDefaultPort ? "" : `:${url.port}`;

  // Remove trailing slashes
  const pathname = url.pathname.replace(/\/+$/, "");

  return `${hostname}${port}${pathname}`;
}

export function getH1FromHTML(htmlString: string): string {
    const dom = new JSDOM(htmlString);
    const h1 = dom.window.document.querySelector("h1");
    return h1?.textContent?.trim() ?? "";
    }

export function getFirstParagraphFromHTML(htmlString: string): string {
    const doc = new JSDOM(htmlString).window.document;
    const main = doc.querySelector("main");
    const p = (main?.querySelector("p")) ?? doc.querySelector("p");
    return p?.textContent?.trim() ?? "";
}

export function getURLsFromHTML(htmlString: string, baseURL: string): string[] {
    let allURLs: string[] = [];
    const dom = new JSDOM(htmlString);
    const a = dom.window.document.querySelectorAll("a");
    for (let i=0; i < a.length; i++) {
      const link = a[i].getAttribute("href")
      if (!link) {
        continue;
      }
      try {
        const absolute = new URL(link, baseURL).href;
        allURLs.push(absolute)
      } catch (error) {
        console.error("Error:", error)
      }
    }
  return allURLs;
}

export function getImagesFromHTML(htmlString: string, baseURL: string): string[] {
    let allImages: string[] = [];
    const dom = new JSDOM(htmlString);
    const img = dom.window.document.querySelectorAll("img");
    for (let i=0; i < img.length; i++) {
      const link = img[i].getAttribute("src")
      if (!link) {
        continue;
      }
      try{
      const absolute = new URL(link, baseURL).href;
      allImages.push(absolute)
    } catch (error) {
      console.error("Error:", error);
    }
  }
  return allImages;
}

export type ExtractedPageData = {
  url: string;
  h1: string;
  first_paragraph: string,
  outgoing_links: string[],
  image_urls: string[],
}

export function extractPageData(htmlString: string, pageURL: string): ExtractedPageData {
  return {
    url: pageURL,
    h1: getH1FromHTML(htmlString),
    first_paragraph: getFirstParagraphFromHTML(htmlString),
    outgoing_links: getURLsFromHTML(htmlString, pageURL),
    image_urls: getImagesFromHTML(htmlString, pageURL),
  };
}

  class ConcurrentCrawler {
    private baseURL: string;
    private pages: Record<string, number>;
    maxPages: number;
    shouldStop: boolean = false;
    allTasks: Set<Promise<void>> = new Set();
    private limit: <T>(fn: () => Promise<T>) => Promise<T>;
    private uniquePagesCount: number = 0;
  
  constructor(baseURL: string, maxConcurrency: number, maxPages: number) {
    this.baseURL = baseURL;
    this.pages = {};
    this.maxPages = maxPages;
    this.limit = pLimit(maxConcurrency);
  }
  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop === true) {
      return false;
    }
    let pagesVisited = Object.keys(this.pages)
    if (pagesVisited.length === this.maxPages) {
      this.shouldStop = true;
      console.log("Reached maximum number of pages to crawl.")
      return false;
    }
    if (normalizedURL in this.pages) {
      this.pages[normalizedURL]++;
      return false;
    }
    this.pages[normalizedURL] = 1;
    this.uniquePagesCount ++;
    return true;
  }
  
  
  private async getHTML(currentURL: string): Promise<string> {
    return await this.limit(async () => {
      try {
      const resp =  await fetch(currentURL, {headers: {
        'User-Agent': 'BootCrawler/1.0'}
      });
      if (!resp.ok) {
        console.error(`Response status: ${resp.status}`);
        throw new Error(`Response status: ${resp.status}`);
      }
      const contentType = resp.headers.get('Content-Type');
      if (contentType && contentType.includes('text/html')) {
        const result = await resp.text();
        return result;
      } else {
        console.error(`Content type is not text/html: ${contentType}`)
        throw new Error('unable to get HTML response');
      }
    } catch (error) {
      console.error(error)
      throw error;
    }
  });
}

private async crawlPage(currentURL: string): Promise<void> {
  
  if (this.shouldStop) {
    return;
  }
  const currentObj = new URL(currentURL);
  const baseObj = new URL(this.baseURL);
  if (currentObj.hostname !== baseObj.hostname) {
     return;
  }
  let currentN = normalizeURL(currentURL);
  if (this.addPageVisit(currentN) === false) {
    return;
  }
  try {
  
    const data = await this.getHTML(currentURL);
    if (!data) {
      return;
    }
    const urlsOnPage = getURLsFromHTML(data, this.baseURL);
    const crawlPromises: Promise<void>[] = [];

    for (const url of urlsOnPage) {
      if (this.shouldStop) {
        break;
      }
      const task = this.crawlPage(url);
      crawlPromises.push(task)
      this.allTasks.add(task);
      task.finally(() => {
      this.allTasks.delete(task);
      });
    };

    console.log(`Crawling: ${currentURL}`);
    console.log(`Found ${urlsOnPage.length} URLs on page`)
    await Promise.all(crawlPromises);
    
  } catch(error) {
      console.error(`unable to crawl page: ${error}`)
    };
  }
}
  
async crawl() {
  await this.crawlPage(this.baseURL);
  return this.pages;
  }  
}

export async function crawlSiteAsync(baseURL: string, maxConcurrency: number = 10, maxPages: number = 100): Promise<Record<string, number>> {
  const crawler = new ConcurrentCrawler(
    baseURL,
    maxConcurrency,
    maxPages,
)
  const result = await crawler.crawl()
  return result;
}
