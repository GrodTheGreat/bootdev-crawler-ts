import { JSDOM } from "jsdom";

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
    if (href) {
      urls.push(baseURL + href);
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
    if (img) {
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
