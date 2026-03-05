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
        const crawl = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);
        console.log(crawl);
    }
}

main();