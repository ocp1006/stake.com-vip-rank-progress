if (typeof vipRanksArray === 'undefined') {
    console.error('vipRanksArray is not defined. Make sure consts.js is loaded before content.js');
}

/**
 * Determines the current VIP rank from a progress bar element.
 * Tries the data-testid ancestor first, then falls back to deriving it
 * from the sibling "Next level:" text.
 * @param {HTMLElement} progressElement
 * @returns {string|null}
 */
function getRankForWidget(progressElement) {
    const testidEl = progressElement.closest('[data-testid^="current-vip-level-"]');
    if (testidEl) {
        return testidEl.getAttribute('data-testid')
            .replace('current-vip-level-', '')
            .replaceAll(' ', '_');
    }

    const nextLevelSpan = progressElement.parentElement?.querySelector('.ds-body-sm[data-ds-text="true"]');
    const match = nextLevelSpan?.textContent?.match(/Next level:\s*(.+)/);
    if (match) {
        const nextRank = match[1].trim().replaceAll(' ', '_');
        const nextIdx = vipRanksArray.findIndex(r => r.rank === nextRank);
        if (nextIdx > 0) return vipRanksArray[nextIdx - 1].rank;
    }

    return null;
}

/**
 * @param {HTMLElement} progressElement
 * @returns {HTMLElement|undefined}
 */
function extractPercentageElement(progressElement) {
    const spans = progressElement.parentElement?.querySelectorAll('.ds-body-sm-strong[data-ds-text="true"]');
    for (const span of spans ?? []) {
        if (span.textContent.includes('%')) return span;
    }
}

/**
 * Injects the amount-required label and amount-wagered label into a single VIP widget.
 * @param {HTMLElement} progressElement - A [data-melt-progress] element.
 */
function injectIntoWidget(progressElement) {
    if (typeof vipRanksArray === 'undefined') return;

    const percentageElement = extractPercentageElement(progressElement);
    if (!percentageElement) return;

    const currentRankName = getRankForWidget(progressElement);
    const currentPercentage = parseFloat(percentageElement.textContent.replace('%', ''));
    const currentRankObj = vipRanksArray.find(r => r.rank === currentRankName) ?? vipRanksArray[0];
    const nextRankObj = vipRanksArray[vipRanksArray.indexOf(currentRankObj) + 1];

    if (!nextRankObj) return;

    const amountRequired = Math.round((nextRankObj.value - currentRankObj.value) * (100 - currentPercentage) / 100);
    const amountSpent = nextRankObj.value - amountRequired;

    percentageElement.innerHTML = `${currentPercentage.toFixed(2)}%&nbsp;<span class="amount-required-label" style="color: ${currentRankObj.color};">($${amountRequired.toLocaleString("en-US")} needed)</span>`;

    const amountSpentLabel = document.createElement('span');
    amountSpentLabel.textContent = `$${amountSpent.toLocaleString("en-US")} wagered`;
    amountSpentLabel.classList.add("amount-spent-label");
    amountSpentLabel.style.color = currentRankObj.color;
    progressElement.insertAdjacentElement('afterend', amountSpentLabel);
}

const progressBarObserver = new MutationObserver(() => {
    document.querySelectorAll('[data-melt-progress]').forEach(progressEl => {
        if (!progressEl.parentElement?.querySelector('.amount-spent-label')) {
            injectIntoWidget(progressEl);
        }
    });
});

progressBarObserver.observe(document.body, { childList: true, subtree: true });
