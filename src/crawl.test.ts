import { expect, test } from "vitest";
import {
  extractPageData,
  getFirstParagraphFromHTML,
  getHeadingFromHTML,
  getImagesFromHTML,
  getURLsFromHTML,
  normalizeURL,
} from "./crawl.js";

// --- Normalization Tests ---

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

// --- Heading Extraction Tests ---

test("getHeadingFromHTML h1", () => {
  const html =
    "<html><body><h1>The Title</h1><h2>The Subtitle</h2></body></html>";
  expect(getHeadingFromHTML(html)).toEqual("The Title");
});

test("getHeadingFromHTML h2 fallback", () => {
  const html = "<html><body><h2>Only Subtitle</h2></body></html>";
  expect(getHeadingFromHTML(html)).toEqual("Only Subtitle");
});

test("getHeadingFromHTML none", () => {
  const html = "<html><body><p>Just a paragraph</p></body></html>";
  expect(getHeadingFromHTML(html)).toEqual("");
});

// --- Paragraph Extraction Tests ---

test("getFirstParagraphFromHTML main priority", () => {
  const html = `
    <html><body>
      <p>Header filler</p>
      <main><p>This is the real content.</p></main>
      <p>Footer filler</p>
    </body></html>
  `;
  expect(getFirstParagraphFromHTML(html)).toEqual("This is the real content.");
});

test("getFirstParagraphFromHTML no main", () => {
  const html =
    "<html><body><p>First paragraph</p><p>Second paragraph</p></body></html>";
  expect(getFirstParagraphFromHTML(html)).toEqual("First paragraph");
});

test("getFirstParagraphFromHTML none", () => {
  const html =
    "<html><body><main><div>No paragraphs here</div></main></body></html>";
  expect(getFirstParagraphFromHTML(html)).toEqual("");
});

// --- URL Extraction Tests ---

test("getURLsFromHTML relative", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = '<html><body><a href="/posts/1">Post 1</a></body></html>';
  expect(getURLsFromHTML(inputBody, inputURL)).toEqual([
    "https://blog.boot.dev/posts/1",
  ]);
});

test("getURLsFromHTML multiple", () => {
  const inputURL = "https://boot.dev";
  const inputBody = `
    <html><body>
      <a href="https://google.com">Google</a>
      <a href="/courses">Courses</a>
    </body></html>
  `;
  expect(getURLsFromHTML(inputBody, inputURL)).toEqual([
    "https://google.com",
    "https://boot.dev/courses",
  ]);
});

test("getURLsFromHTML no href", () => {
  const inputURL = "https://boot.dev";
  const inputBody =
    '<html><body><a name="top">Anchor with no link</a></body></html>';
  expect(getURLsFromHTML(inputBody, inputURL)).toEqual([]);
});

// --- Image Extraction Tests ---

test("getImagesFromHTML absolute", () => {
  const inputURL = "https://boot.dev";
  const inputBody =
    '<html><body><img src="https://other-site.com/pic.jpg"></body></html>';
  expect(getImagesFromHTML(inputBody, inputURL)).toEqual([
    "https://other-site.com/pic.jpg",
  ]);
});

test("getImagesFromHTML relative", () => {
  const inputURL = "https://boot.dev";
  const inputBody = '<html><body><img src="/assets/logo.png"></body></html>';
  expect(getImagesFromHTML(inputBody, inputURL)).toEqual([
    "https://boot.dev/assets/logo.png",
  ]);
});

test("getImagesFromHTML missing src", () => {
  const inputURL = "https://boot.dev";
  const inputBody = '<html><body><img alt="Broken Image Tag"></body></html>';
  expect(getImagesFromHTML(inputBody, inputURL)).toEqual([]);
});

// --- extractPageData Tests ---

test("extractPageData full", () => {
  const url = "https://boot.dev";
  const html = `
    <html>
      <body>
        <h1>Welcome</h1>
        <main><p>The main content.</p></main>
        <a href="/about">About</a>
        <img src="/img.png">
      </body>
    </html>
  `;
  expect(extractPageData(html, url)).toEqual({
    url: "https://boot.dev",
    heading: "Welcome",
    firstParagraph: "The main content.",
    outgoingLinks: ["https://boot.dev/about"],
    imageURLs: ["https://boot.dev/img.png"],
  });
});

test("extractPageData fallbacks", () => {
  const url = "https://boot.dev";
  const html =
    "<html><body><h2>Subtitle Only</h2><p>No main tag.</p></body></html>";
  const actual = extractPageData(html, url);
  expect(actual.heading).toEqual("Subtitle Only");
  expect(actual.firstParagraph).toEqual("No main tag.");
});

test("extractPageData empty", () => {
  const url = "https://empty.com";
  const html = "<html><body></body></html>";
  expect(extractPageData(html, url)).toEqual({
    url: "https://empty.com",
    heading: "",
    firstParagraph: "",
    outgoingLinks: [],
    imageURLs: [],
  });
});

test("extractPageData no main p", () => {
  const url = "https://boot.dev";
  const html = "<html><body><p>Outside p</p></body></html>";
  const actual = extractPageData(html, url);
  expect(actual.firstParagraph).toEqual("Outside p");
});
