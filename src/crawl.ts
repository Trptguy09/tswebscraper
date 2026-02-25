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