import { expect, test } from "vitest";
import {
  extractPageData,
  getFirstParagraphFromHTML,
  getHeadingFromHTML,
  getImagesFromHTML,
  getURLsFromHTML,
  normalizeURL,
} from "./crawl.js";

test("normalize url protocol", () => {
  expect(normalizeURL("https://www.boot.dev/blog/path")).toEqual(
    "www.boot.dev/blog/path",
  );
});
test("normalize url slash", () => {
  expect(normalizeURL("https://www.boot.dev/blog/path/")).toEqual(
    "www.boot.dev/blog/path",
  );
});
test("normalize url http", () => {
  expect(normalizeURL("http://www.boot.dev/blog/path")).toEqual(
    "www.boot.dev/blog/path",
  );
});
test("normalize url capitals", () => {
  expect(normalizeURL("https://WWW.boot.dev/Blog/Path/")).toEqual(
    "www.boot.dev/blog/path",
  );
});

test("getHeadingFromHTML basic", () => {
  const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
  const actual = getHeadingFromHTML(inputBody);
  const expected = "Test Title";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML main priority", () => {
  const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "Main paragraph.";
  expect(actual).toEqual(expected);
});

test("getURLsFromHTML absolute", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://crawler-test.com/path/one"];

  expect(actual).toEqual(expected);
});

test("getImagesFromHTML relative", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = ["https://crawler-test.com/logo.png"];

  expect(actual).toEqual(expected);
});

test("extractPageData basic", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

  const actual = extractPageData(inputBody, inputURL);
  const expected = {
    url: "https://crawler-test.com",
    heading: "Test Title",
    firstParagraph: "This is the first paragraph.",
    outgoingLinks: ["https://crawler-test.com/link1"],
    imageURLs: ["https://crawler-test.com/image1.jpg"],
  };

  expect(actual).toEqual(expected);
});
