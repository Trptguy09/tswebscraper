import * as path from "node:path";
import { writeFileSync } from "node:fs";
import { ExtractedPageData } from "./crawl";


export function writeJSONReport(
    pageData: Record<string, ExtractedPageData>,
    filename = "report.json",
): void {
    const sorted = Object.values(pageData).sort((a,b) => a.url.localeCompare(b.url));
    const dataJSON = JSON.stringify(sorted, null, 2);
    const resolved = path.resolve(process.cwd(), filename);
    writeFileSync(resolved, dataJSON);
}