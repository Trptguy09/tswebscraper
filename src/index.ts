import { crawlSiteAsync} from "./crawl";

async function main() {

    let args = process.argv.slice(2);
    if (args.length < 3) {
        console.error("Not enough arguments");
        process.exit(1);
    }
    else if (args.length > 3) {
        console.error("Too many arguments");
        process.exit(1);
    } else {
        const baseURL = args[0];
        const maxConcurrency = Number(args[1]);
        const maxPages = Number(args[2])
        console.log(`Crawling at ${baseURL}`)
        const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);
        console.log("Finished crawling.");
        const firstPage = Object.values(pages)[0];
        if (firstPage) {
            console.log( `First page record: ${firstPage["url"]} - ${firstPage["heading"]}`)
        }
    }
}

main();