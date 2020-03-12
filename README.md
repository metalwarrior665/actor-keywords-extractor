## Keyword Extractor

Can deeply crawl a website and counts how many times are provided keywords found on the page.

### How to use
- You can pass in any number of keywords that you want to count.
- You can combine Start URLs, Pseudo Urls and link selector to traverse any number of pages accross websites. Check our [scraping tutorial](https://docs.apify.com/scraping) on how to use these.
- You can specify `maxDepth` and `maxPagesPerCrawl` to limit the scope of the scrape. Start URLs have depth 0. So if you want just the start URLs, set `maxDepth` to 0, etc.
- You can pick case sensitive search and search through scripts.
- You can choose to scrape with or without browser. Browser is more expensive but allows JavaScript rendering and waiting.
- For browser, you can use many additional features

### How are keywords determined
The text is split into words by [word boundaries](https://www.regular-expressions.info/wordboundaries.html). Each word is then compared with each keyword. In the future, we may add other types of boundaries to choose from.

### Example Output
For `keywords`:
```
["watch", "watches", "rolex"]
```
starting on `https://www.chrono24.com/watches/mens-watches--62.htm`
```
[
    {
        "url": "https://www.chrono24.com/watches/mens-watches--62.htm",
        "depth": 0,
        "result": {
            "watch": 63,
            "watches": 81,
            "rolex": 57
        }
    },
    {
        "url": "https://www.chrono24.com/user/index.htm",
        "depth": 1,
        "result": {
            "watch": 9,
            "watches": 13,
            "rolex": 1
        }
    },
    {
        "url": "https://www.chrono24.com/info/watch-collection.htm",
        "depth": 1,
        "result": {
            "watch": 56,
            "watches": 23,
            "rolex": 1
        }
    },
...
]
```

