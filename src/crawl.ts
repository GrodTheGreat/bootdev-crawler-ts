import { JSDOM } from "jsdom";
import pLimit, { LimitFunction } from "p-limit";

export function normalizeURL(url: string): string {
  const normalized = new URL(url);
  const hostname = normalized.hostname.toLowerCase();
  let path = normalized.pathname.toLowerCase();
  if (path[path.length - 1] === "/") path = path.slice(0, -1);
  return hostname + path;
}

export function getHeadingFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const h1 = dom.window.document.querySelector("h1");
  if (h1 === null) {
    const h2 = dom.window.document.querySelector("h2");
    return h2 ? h2.textContent : "";
  }
  return h1.textContent;
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const main = dom.window.document.querySelector("main");
  if (main === null) {
    const p = dom.window.document.querySelector("p");
    return p ? p.textContent : "";
  }
  const p = main.querySelector("p");
  return p ? p.textContent : "";
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const urls = [];
  const as = dom.window.document.querySelectorAll("a");
  for (const a of as) {
    const href = a.getAttribute("href");
    if (!href) continue;
    if (URL.canParse(href)) {
      urls.push(href);
    } else {
      urls.push(new URL(href, baseURL).href);
    }
  }
  return urls;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const images = [];
  const imgs = dom.window.document.querySelectorAll("img");
  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (!src) continue;
    if (URL.canParse(src)) {
      images.push(src);
    } else {
      images.push(baseURL + src);
    }
  }
  return images;
}

export type ExtractedPageData = {
  url: string;
  heading: string;
  firstParagraph: string;
  outgoingLinks: string[];
  imageURLs: string[];
};

export function extractPageData(
  html: string,
  pageURL: string,
): ExtractedPageData {
  return {
    url: pageURL,
    heading: getHeadingFromHTML(html),
    firstParagraph: getFirstParagraphFromHTML(html),
    outgoingLinks: getURLsFromHTML(html, pageURL),
    imageURLs: getImagesFromHTML(html, pageURL),
  };
}

export class ConcurrentCrawler {
  private pages: Record<string, ExtractedPageData> = {};
  private maxPages: number;
  private limit: LimitFunction;
  private shouldStop: boolean = false;
  private allTasks: Set<Promise<void>> = new Set();

  constructor(
    public baseURL: string,
    limit: number,
    maxPages: number,
  ) {
    this.limit = pLimit(limit);
    this.maxPages = maxPages;
  }

  public async crawl(): Promise<Record<string, ExtractedPageData>> {
    await this.crawlPage(this.baseURL);
    return this.pages;
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop) return true;
    if (Object.keys(this.pages).length >= this.maxPages) {
      this.shouldStop = true;
      console.log("Reached maximum number of pages to crawl.");
      return true;
    }

    if (this.pages[normalizedURL]) {
      return true;
    }
    return false;
  }

  private async getHTML(url: string): Promise<string> {
    return await this.limit(async () => {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "BootCrawler/1.0" },
        });
        if (response.status >= 400) {
          console.error(`Failed to fetch page at: ${url}`);
          return "";
        }
        if (!response.headers.get("content-type")?.includes("text/html")) {
          console.error("Response did not contain html");
          return "";
        }
        const html = await response.text();
        return html;
      } catch {
        console.error("Unexpected failure to fetch");
        return "";
      }
    });
  }

  async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) return;
    const current = new URL(currentURL);
    const base = new URL(this.baseURL);
    if (current.hostname !== base.hostname) return;

    const path = normalizeURL(currentURL);
    if (this.addPageVisit(path)) return;

    try {
      console.log(`crawling ${currentURL}`);
      const html = await this.getHTML(currentURL);
      const data = extractPageData(html, this.baseURL);
      this.pages[currentURL] = data;
      const promises = data.outgoingLinks.map((link) =>
        this.allTasks.add(this.crawlPage(link)),
      );
      await Promise.all(promises).finally(() => this.allTasks.clear());
    } catch {
      console.error(`failed to fetch html for ${path}`);
    }
  }
}

export async function crawlSiteAsync(
  url: string,
  limit: number,
  maxPages: number,
): Promise<Record<string, ExtractedPageData>> {
  const crawler = new ConcurrentCrawler(url, limit, maxPages);
  return await crawler.crawl();
}
