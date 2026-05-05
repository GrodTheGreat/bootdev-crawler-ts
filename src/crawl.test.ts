import { expect, test } from "vitest";
import { normalizeURL } from "./crawl.js";

test("normalize url protocol", () => {
  expect(normalizeURL("https://www.boot.dev/blog/path")).toBe(
    "www.boot.dev/blog/path",
  );
});
test("normalize url slash", () => {
  expect(normalizeURL("https://www.boot.dev/blog/path/")).toBe(
    "www.boot.dev/blog/path",
  );
});
test("normalize url http", () => {
  expect(normalizeURL("http://www.boot.dev/blog/path")).toBe(
    "www.boot.dev/blog/path",
  );
});
test("normalize url capitals", () => {
  expect(normalizeURL("https://WWW.boot.dev/Blog/Path/")).toBe(
    "www.boot.dev/blog/path",
  );
});
