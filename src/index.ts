import { crawlSiteAsync } from "./crawl.js";
import { writeJSONReport } from "./report.js";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("no website provided");
  process.exit(1);
}
if (args.length > 3) {
  console.error("too many arguments provided");
  process.exit(1);
}
const baseURL = args[0];
const limit = Number(args[1]) || 5;
const maxPages = Number(args[2]) || 100;
const pages = await crawlSiteAsync(baseURL, limit, maxPages);
console.log("finished crawling");
const firstPage = Object.values(pages)[0];
if (firstPage)
  console.log(`First page record: ${firstPage.url} - ${firstPage.heading}`);
writeJSONReport(pages);
process.exit(0);
