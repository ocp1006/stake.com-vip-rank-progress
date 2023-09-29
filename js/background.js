chrome.webNavigation.onCompleted.addListener(details => {
    // Check if the URL matches the pattern for Stake.com
    if (/^https:\/\/stake\.com(\/.*)?$/.test(details.url)) {
        // Inject the content scripts
        chrome.scripting.executeScript({
            target: { tabId: details.tabId },
            files: ['js/consts.js', 'js/content.js']
        });
    }
}, { url: [{ urlMatches: '^https:\/\/stake\.com(\/.*)?$' }] });
