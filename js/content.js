/**
 * This script enhances the VIP progress display on a web page by adding additional information
 * about the current rank, progress, and amount required for the next rank.
 */

// Ensure vipRanksArray is available
if (typeof vipRanksArray === 'undefined') {
    console.error('vipRanksArray is not defined. Make sure consts.js is loaded before content.js');
}

/**
 * Groups the last `count` child elements of `parent` into a new div and appends this div to `parent`.
 * @param {HTMLElement} parent - The parent element whose children are to be grouped.
 * @param {number} count - The number of last child elements to group.
 * @returns {HTMLElement} The newly created div containing the grouped elements.
 */
function groupElements(parent, count) {
    const elementsToGroup = [...parent.children].slice(-count);
    const wrapperDiv = document.createElement('div');

    elementsToGroup.forEach(node => wrapperDiv.appendChild(node));
    parent.appendChild(wrapperDiv);
    return wrapperDiv;
}

/**
 * Retrieves the current VIP rank from the DOM.
 * @returns {string|null} The current rank or null if not found.
 */
function getCurrentRank() {
    const rankElement = document.querySelector('.miletone-wrap:first-child');
    return rankElement ? rankElement.textContent.trim().replace(' ', '_') : null;
}

/**
 * Creates a new label element based on a base element, with specified text and color.
 * @param {HTMLElement} baseElement - The element to clone attributes from.
 * @param {string} text - The text content for the new label.
 * @param {string} color - The color for the new label.
 * @returns {HTMLElement} The created label element.
 */
function createLabel(baseElement, text, color) {
    const label = baseElement.cloneNode(false);
    label.textContent = text;
    label.style.color = color;
    return label;
}

/**
 * Extracts the percentage element from the progress bar.
 * @returns {HTMLElement|undefined} The percentage element or undefined if not found.
 */
function extractPercentage() {
    const progress = document.querySelector('div[class^="miletone-wrap"]')?.closest('.flex.flex-col');
    if (!progress) {
        console.error("VIP progress container not found");
        return;
    }

    const percentageElement = progress.querySelector('span.variant-highlighted.numeric');
    if (!percentageElement) {
        console.error("VIP progress percentage element not found");
        return;
    }

    return percentageElement;
}

/**
 * Calculates the amount required for the next VIP rank and updates the DOM with this information.
 */
function calculateAmountRequired() {
    if (typeof vipRanksArray === 'undefined') {
        console.error('vipRanksArray is not defined. Cannot calculate amount required.');
        return;
    }

    const progressElement = document.querySelector('[data-melt-progress]');
    if (!progressElement) {
        console.error("Could not find the progress bar element.");
        return;
    }
    
    const currentRank = getCurrentRank();
    const percentageElement = extractPercentage();
    if (!percentageElement) return;

    const currentPercentage = parseFloat(percentageElement.textContent.replace('%', ''));
    const currentRankObj = vipRanksArray.find(rankObj => rankObj.rank === currentRank) || vipRanksArray[0];
    const nextRankObj = vipRanksArray[vipRanksArray.indexOf(currentRankObj) + 1];

    if (!nextRankObj) {
        console.log("User is at the highest rank.");
        return;
    }

    const amountRequired = Math.round((nextRankObj.value - currentRankObj.value) * (100 - currentPercentage) / 100);
    const amountSpent = nextRankObj.value - amountRequired;

    // Update percentage display to include amount required, colored with current rank color
    percentageElement.innerHTML = `${currentPercentage.toFixed(2)}%&nbsp;<span style="color: ${currentRankObj.color};">($${amountRequired.toLocaleString("en-US")})</span>`;

    // Create and add amount spent label inside the progress bar
    const amountSpentLabel = createLabel(percentageElement, `$${amountSpent.toLocaleString("en-US")}`, "white");
    amountSpentLabel.classList.add("amount-spent-label");
    progressElement.appendChild(amountSpentLabel);
}

// Create a MutationObserver to detect when the progress bar is added to the DOM
const progressBarObserver = new MutationObserver((mutations, observer) => {
    if (document.querySelector('[data-melt-progress]')) {
        calculateAmountRequired();
        observer.disconnect();
    }
});

// Start observing the body for changes
progressBarObserver.observe(document.body, {
    childList: true,
    subtree: true
});
