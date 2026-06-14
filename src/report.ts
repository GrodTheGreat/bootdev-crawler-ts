import fs from "fs";
import path from "path";
import { ExtractedPageData } from "./crawl.js";

export function writeJSONReport(
  pageData: Record<string, ExtractedPageData>,
  filename: string = "report.json",
): void {
  const sorted = Object.values(pageData).sort((a, b) =>
    a.url.localeCompare(b.url),
  );
  const json = JSON.stringify(sorted, null, 2);
  const report = path.resolve(process.cwd(), filename);
  fs.writeFileSync(report, json);
}
