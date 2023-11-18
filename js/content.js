
/**
 * Groups the last `count` child elements of `parent` into a new div and appends this div to `parent`.
 * @param {HTMLElement} parent - The parent element whose children are to be grouped.
 * @param {number} count - The number of last child elements to group.
 * @returns {HTMLElement} - The newly created div containing the grouped elements.
 */
function groupElements(parent, count) {
    const elementsToGroup = [...parent.children].slice(-count);
    const wrapperDiv = document.createElement('div');

    elementsToGroup.forEach(node => wrapperDiv.appendChild(node));
    parent.appendChild(wrapperDiv);
    return wrapperDiv;
}


/**
 * Retrieves the current rank from the DOM.
 * @returns {string|null} - The current rank or null if not found.
 */
function getCurrentRank() {
    const rankElement = document.querySelector(".progress-bar-wrap > div > div > div span:last-child");
    return rankElement ? rankElement.textContent.trim().replace(' ', '_') : null;
}

/**
 * Creates a new label element based on a base element, with specified text and color.
 * @param {HTMLElement} baseElement - The element to clone attributes from.
 * @param {string} text - The text content for the new label.
 * @param {string} color - The color for the new label.
 * @returns {HTMLElement} - The created label element.
 */
function createLabel(baseElement, text, color) {
    const label = baseElement.cloneNode(false);
    label.textContent = text;
    label.style.color = color;
    return label;
}

/**
 * Calculates the amount required for the next VIP rank and updates the DOM with this information.
 */
function calculateAmountRequired() {
    const progressElement = document.querySelector('.progress-heading');
    if (!progressElement) {
        console.error("Could not find the progress bar element.");
        return;
    }

    const currentRank = getCurrentRank();
    const percentObject = progressElement.lastElementChild;
    const currentPercentage = parseFloat(percentObject.textContent.replace('%', ''));
    const currentRankObj = vipRanksArray.find(rankObj => rankObj.rank === currentRank) || vipRanksArray["None"];
    const currentRankValue = currentRankObj.value;
    const nextRankIndex = vipRanksArray.findIndex(rankObj => rankObj.rank === currentRank) + 1;

    if (nextRankIndex >= vipRanksArray.length) {
        console.log("User is at the highest rank.");
        return;
    }

    const nextRankValue = vipRanksArray[nextRankIndex].value;
    const amountRequired = Math.round((nextRankValue - currentRankValue) * (100 - currentPercentage) / 100);
    const amountRequiredLabel = createLabel(percentObject, `($${amountRequired.toLocaleString("en-US")})`, vipRanksArray[nextRankIndex].color);
    amountRequiredLabel.classList.add("amount-required-label");
    progressElement.appendChild(amountRequiredLabel);
    groupElements(progressElement, 2);

    const amountSpent = nextRankValue - amountRequired;
    const amountSpentLabel = createLabel(percentObject, `$${amountSpent.toLocaleString("en-US")}`, "black");
    amountSpentLabel.classList.add("amount-spent-label");

    const progressBar = document.querySelector('.progress-bar');
    const progressBarContainer = progressBar.parentElement;
    progressBarContainer.appendChild(amountSpentLabel);
}

// Observes changes in the body to detect the appearance of the progress bar and then calls `calculateAmountRequired`.
const mutationObserver = new MutationObserver(() => {
    if (document.querySelector('.progress-heading')) {
		calculateAmountRequired();
        mutationObserver.disconnect();
    }
});

mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
});
