const Apify = require('apify');
const jsdom = require('jsdom');
const cheerio = require('cheerio');

const { JSDOM } = jsdom;

const { findKeywords } = require('./keyword-extraction');

Apify.main(async () => {
    const input = await Apify.getInput();
    console.log('Input:');
    console.dir(input);

    const {
        startUrls,
        pseudoUrls = [],
        linkSelector,
        keywords = [],
        caseSensitive = false,
        scanScripts = false,
        maxConcurrency,
        maxDepth = 5,
        maxPagesPerCrawl,
        useBrowser = false,
        proxyConfiguration = { useApifyProxy: true },
        retireInstanceAfterRequestCount = 10,
        useChrome = false,
        waitFor,
    } = input;

    const options = {
        inCaseInsensitive: !caseSensitive,
        scanScripts,
    };

    if (keywords.length === 0) {
        throw new Error('WRONG INPUT: No keywords to extract provided!');
    }

    const proxyUrl = proxyConfiguration.useApifyProxy
        ? Apify.getApifyProxyUrl({ groups: proxyConfiguration.apifyProxyGroups, country: proxyConfiguration.apifyProxyCountry })
        : null;

    const requestQueue = await Apify.openRequestQueue();

    for (const req of startUrls) {
        await requestQueue.addRequest({
            ...req,
            headers: { 'User-Agent': Apify.utils.getRandomUserAgent() },
            userData: { depth: 0 },
        });
    }

    const handlePageFunction = async ({ request, $, body, page }) => {
        const { depth } = request.userData;
        if (page && waitFor) {
            // We wait for number in ms or a selector
            const maybeNumber = Number(waitFor);
            await page.waitFor(maybeNumber || maybeNumber === 0 ? maybeNumber : waitFor);
        }

        // We use native dom in browser and library parser for Cheerio
        let result;
        if (page) {
            result = await page.evaluate(findKeywords, null, keywords, options);
        } else {
            const dom = new JSDOM(body);
            const { document } = dom.window;
            result = findKeywords(document, keywords, options);
        }

        await Apify.pushData({
            url: request.url,
            depth,
            result,
        });

        if (depth >= maxDepth) {
            console.log('Reached max depth, not enqueing more ---', request.url);
        }

        if (!$) {
            const html = await page.content();
            $ = cheerio.load(html);
        }

        if (linkSelector) {
            await Apify.utils.enqueueLinks({
                $,
                selector: linkSelector,
                pseudoUrls: pseudoUrls.map((req) => new Apify.PseudoUrl(req.purl)),
                requestQueue,
                baseUrl: request.loadedUrl,
                transformRequestFunction: (request) => {
                    request.headers = { 'User-Agent': Apify.utils.getRandomUserAgent() };
                    request.userData = { depth: depth + 1 };
                    return request;
                },
            });
        }
    };

    const basicOptions = {
        maxRequestRetries: 3,
        maxRequestsPerCrawl: maxPagesPerCrawl,
        maxConcurrency,
        requestQueue,
        handlePageFunction,
        proxyUrls: proxyUrl ? [proxyUrl] : null,
        additionalMimeTypes: ['application/xml'], // For CheerioCrawler
    };

    const launchPuppeteerOptions = {
        proxyUrl,
        stealth: true,
        useChrome,
        userAgent: Apify.utils.getRandomUserAgent(),
    };

    const puppeteerPoolOptions = { retireInstanceAfterRequestCount };

    const crawler = useBrowser
        ? new Apify.PuppeteerCrawler({ ...basicOptions, launchPuppeteerOptions, puppeteerPoolOptions })
        : new Apify.CheerioCrawler({ ...basicOptions, proxyUrls: proxyUrl ? [proxyUrl] : null });


    console.log('Starting crawler...');
    await crawler.run();
    console.log('Crawler.finished!');
});
