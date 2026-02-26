
function main() {

let args = process.argv.slice(2);
if (args.length < 1) {
    console.error("No arguments");
    process.exit(1);
}
else if (args.length > 1) {
    console.error("Too many arguments");
    process.exit(1);
} else {
    const baseURL = args[0] 
    console.log(`Crawling at ${baseURL}`)
    process.exit(0)
    }
}

main();