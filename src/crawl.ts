import { JSDOM } from 'jsdom'


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

export async function getHTML(url: string) {
  try {
    const resp =  await fetch(url, {headers: {
      'User-Agent': 'BootCrawler/1.0'}
    });
    if (!resp.ok) {
      console.error(`Response status: ${resp.status}`);
      return;
  }
    const contentType = resp.headers.get('Content-Type');
    if (contentType && contentType.includes('text/html')) {
      const result = await resp.text();
      return result;
    } else {
      console.error(`Content type is not text/html: ${contentType}`)
      return;
    }
  } catch (error) {
    console.error(error);
  }
}