// TODO: Improve cleaning of extraction so we extract only from relevant text
// e.g. handle better iframes and nested stuff
module.exports.findKeywords = (documentInput, keywords, options = {}) => {
    const { scanScripts = false, isCaseInsensitive = true } = options;

    const result = {};

    // Have to put this in for page.evaluate
    const createRegexes = (keywords, isCaseInsensitive) => {
        const regexArray = keywords.map((keyword) => {
            return {
                keyword,
                regex: new RegExp(`\\b${keyword}\\b`, isCaseInsensitive ? 'gi' : 'g'),
            };
        });
        return regexArray;
    };

    const regexes = createRegexes(keywords, isCaseInsensitive);

    const _document = documentInput || document;
    const queue = [_document.body];
    let curr;

    while (curr = queue.pop()) {
        for (let i = 0; i < curr.childNodes.length; ++i) {
            const node = curr.childNodes[i];
            if (node.nodeName === 'SCRIPT' && !scanScripts) {
                // console.log('Skipping script');
                continue;
            }

            const nodeType = node.nodeType;
            switch (nodeType) {
                case 3 : // Node.TEXT_NODE
                    const text = node.textContent;
                    regexes.forEach(({ keyword, regex }) => {
                        const match = text.match(regex);
                        if (match && match.length > 0) {
                            // console.log(`Found count: ${match.length}, keyword: ${keyword} in text --> ${text}`);
                            if (!result[keyword]) {
                                result[keyword] = 0;
                            }
                            result[keyword] += match.length;
                        }
                    })

                    break;
                case 1 : // Node.ELEMENT_NODE
                    queue.push(node);
                    break;
                default:
                    break;
            }
        }
    }
    return result;
}
