const DIAGNOSTIC_SCAN_EVENT_INTERVAL_MS = 15000;
const DIAGNOSTIC_NO_PROGRESS_EVENT_INTERVAL_MS = 30000;
const MUTATION_DEBOUNCE_MS = 250;
const VIP_WIDGET_SELECTOR = '[data-testid^="current-vip-level-"]';
const PROGRESS_SELECTORS = [
    `${VIP_WIDGET_SELECTOR} [data-melt-progress]`,
    `${VIP_WIDGET_SELECTOR} [data-progress-root]`,
    `${VIP_WIDGET_SELECTOR} [role="progressbar"]`,
    `${VIP_WIDGET_SELECTOR} [aria-valuenow][aria-valuemax]`
];
const DIAGNOSTIC_CANDIDATE_SELECTOR = [
    VIP_WIDGET_SELECTOR,
    ...PROGRESS_SELECTORS,
    `${VIP_WIDGET_SELECTOR} [data-testid*="level" i]`,
    `${VIP_WIDGET_SELECTOR} [data-ds-text="true"]`
].join(', ');

let lastScanEventAt = 0;
let lastNoProgressEventAt = 0;
let lastProgressCount = -1;
let scanCount = 0;
let pendingMutationScan = null;
const diagnosticEvents = [];
const loggedSkippedWidgets = new WeakSet();

function getExtensionRuntime() {
    return globalThis.chrome?.runtime;
}

function getExtensionManifest() {
    try {
        return getExtensionRuntime()?.getManifest?.() ?? null;
    } catch (error) {
        return null;
    }
}

function rememberDiagnosticEvent(level, message, details) {
    diagnosticEvents.push({
        at: new Date().toISOString(),
        level,
        message,
        details: details ?? null,
        stack: new Error().stack?.split('\n').slice(2, 8) ?? []
    });

    while (diagnosticEvents.length > 80) {
        diagnosticEvents.shift();
    }
}

function recordDiagnostic(level, message, details) {
    rememberDiagnosticEvent(level, message, details);
}

function summarizeElement(element) {
    if (!element) return null;

    return {
        tagName: element.tagName,
        id: element.id || null,
        className: typeof element.className === 'string' ? element.className : null,
        dataTestId: element.getAttribute('data-testid'),
        dataMeltProgress: element.hasAttribute('data-melt-progress'),
        role: element.getAttribute('role'),
        ariaValueNow: element.getAttribute('aria-valuenow'),
        text: element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200) || '',
        html: element.outerHTML?.replace(/\s+/g, ' ').trim().slice(0, 500) || ''
    };
}

function normalizeRankName(rankName) {
    return rankName?.trim().replace(/\s+/g, '_') ?? null;
}

function parsePercentageText(text) {
    const match = text?.match(/(\d+(?:\.\d+)?)\s*%/);
    return match ? Number.parseFloat(match[1]) : Number.NaN;
}

function uniqueElements(elements) {
    return Array.from(new Set(elements));
}

function queryAllSafe(root, selector) {
    try {
        return Array.from(root.querySelectorAll(selector));
    } catch (error) {
        recordDiagnostic('warn', 'selector-query-failed', { selector, error: String(error) });
        return [];
    }
}

function findProgressElements() {
    return uniqueElements(PROGRESS_SELECTORS.flatMap(selector => queryAllSafe(document, selector)));
}

function findTextCandidates(root) {
    return uniqueElements([
        ...queryAllSafe(root, '[data-ds-text="true"]'),
        ...queryAllSafe(root, 'span, div, p')
    ]);
}

function hasPercentageText(element) {
    return !Number.isNaN(parsePercentageText(element.textContent));
}

function looksLikeVipWidget(element) {
    const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const testIds = queryAllSafe(element, '[data-testid]').map(el => el.getAttribute('data-testid')).join(' ');
    return /vip|next level|current level|level|rank/i.test(`${text} ${testIds}`);
}

function getWidgetRoot(progressElement) {
    const vipWidget = progressElement.closest(VIP_WIDGET_SELECTOR);
    if (vipWidget) return vipWidget;

    let current = progressElement.parentElement;
    let fallback = progressElement.parentElement;
    let depth = 0;

    while (current && current !== document.body && depth < 8) {
        if (hasPercentageText(current)) fallback = current;
        if (hasPercentageText(current) && looksLikeVipWidget(current)) return current;
        current = current.parentElement;
        depth += 1;
    }

    return fallback;
}

function getVipRanksArray() {
    if (typeof vipRanksArray !== 'undefined') return vipRanksArray;
    return window.vipRanksArray;
}

if (!Array.isArray(getVipRanksArray())) {
    recordDiagnostic('error', 'vipRanksArray is not defined. Make sure consts.js is loaded before content.js');
}

/**
 * Determines the current VIP rank from a progress bar element.
 * Tries the data-testid ancestor first, then falls back to deriving it
 * from the sibling "Next level:" text.
 * @param {HTMLElement} progressElement
 * @returns {string|null}
 */
function getRankForWidget(progressElement) {
    const ranks = getVipRanksArray();
    const testidEl = progressElement.closest('[data-testid^="current-vip-level-"]');
    if (testidEl) {
        const dataTestId = testidEl.getAttribute('data-testid');
        const rank = normalizeRankName(dataTestId?.replace('current-vip-level-', ''));
        recordDiagnostic('log', 'rank-detected-from-data-testid', {
            rank,
            dataTestId,
            element: summarizeElement(testidEl)
        });
        return rank;
    }

    const widgetRoot = getWidgetRoot(progressElement);
    const textCandidates = findTextCandidates(widgetRoot ?? progressElement.parentElement);
    const nextLevelSpan = textCandidates.find(span => /Next level:/i.test(span.textContent ?? ''));
    const match = nextLevelSpan?.textContent?.match(/Next level:\s*(.+)/);
    if (match) {
        const nextRank = normalizeRankName(match[1]);
        const nextIdx = ranks.findIndex(r => r.rank === nextRank);
        if (nextIdx > 0) {
            const rank = ranks[nextIdx - 1].rank;
            recordDiagnostic('log', 'rank-derived-from-next-level-text', {
                rank,
                nextRank,
                nextLevelText: nextLevelSpan.textContent,
                nextLevelElement: summarizeElement(nextLevelSpan)
            });
            return rank;
        }

        recordDiagnostic('warn', 'next-level-text-found-but-rank-not-mapped', {
            nextRank,
            nextLevelText: nextLevelSpan.textContent,
            knownRanks: ranks.map(r => r.rank)
        });
    }

    recordDiagnostic('warn', 'rank-detection-failed', {
        progressElement: summarizeElement(progressElement),
        widgetRoot: summarizeElement(widgetRoot),
        textCandidates: textCandidates.slice(0, 10).map(summarizeElement)
    });
    return null;
}

/**
 * @param {HTMLElement} progressElement
 * @returns {HTMLElement|undefined}
 */
function extractPercentageElement(progressElement) {
    const widgetRoot = getWidgetRoot(progressElement);
    const candidates = findTextCandidates(widgetRoot ?? progressElement.parentElement);

    const percentageElement = [
        candidates.find(candidate => candidate.matches('[data-ds-text="true"]') && /^\s*\d+(?:\.\d+)?\s*%\s*$/.test(candidate.textContent ?? '')),
        candidates.find(candidate => candidate.tagName === 'SPAN' && /^\s*\d+(?:\.\d+)?\s*%\s*$/.test(candidate.textContent ?? '')),
        candidates.find(candidate => candidate.matches('[data-ds-text="true"]') && !Number.isNaN(parsePercentageText(candidate.textContent))),
        candidates.find(candidate => !Number.isNaN(parsePercentageText(candidate.textContent)))
    ].find(Boolean);

    if (percentageElement) {
        recordDiagnostic('log', 'percentage-element-detected', {
            percentageText: percentageElement.textContent,
            element: summarizeElement(percentageElement)
        });
        return percentageElement;
    }

    recordDiagnostic('warn', 'percentage-element-not-found', {
        progressElement: summarizeElement(progressElement),
        widgetRoot: summarizeElement(widgetRoot),
        candidates: candidates.slice(0, 10).map(summarizeElement)
    });
}

/**
 * Injects the amount-required label and amount-wagered label into a single VIP widget.
 * @param {HTMLElement} progressElement - A [data-melt-progress] element.
 */
function injectIntoWidget(progressElement) {
    const ranks = getVipRanksArray();
    if (!Array.isArray(ranks)) return;

    const percentageElement = extractPercentageElement(progressElement);
    if (!percentageElement) return;

    const currentRankName = getRankForWidget(progressElement);
    const currentPercentage = parsePercentageText(percentageElement.textContent);
    if (Number.isNaN(currentPercentage)) {
        recordDiagnostic('warn', 'percentage-parse-failed', {
            percentageText: percentageElement.textContent,
            percentageElement: summarizeElement(percentageElement)
        });
        return;
    }

    const currentRankObj = ranks.find(r => r.rank === currentRankName) ?? ranks[0];
    const nextRankObj = ranks[ranks.indexOf(currentRankObj) + 1];

    if (!currentRankName) {
        recordDiagnostic('warn', 'using-default-rank-after-rank-detection-failed', {
            defaultRank: currentRankObj,
            percentage: currentPercentage
        });
    }

    if (!nextRankObj) {
        recordDiagnostic('warn', 'next-rank-not-found', {
            currentRankName,
            currentRankObj,
            percentage: currentPercentage
        });
        return;
    }

    const amountRequired = Math.round((nextRankObj.value - currentRankObj.value) * (100 - currentPercentage) / 100);
    const amountSpent = nextRankObj.value - amountRequired;

    percentageElement.innerHTML = `${currentPercentage.toFixed(2)}%&nbsp;<span class="amount-required-label" style="color: ${currentRankObj.color};">($${amountRequired.toLocaleString("en-US")} needed)</span>`;

    const amountSpentLabel = document.createElement('span');
    amountSpentLabel.textContent = `$${amountSpent.toLocaleString("en-US")} wagered`;
    amountSpentLabel.classList.add("amount-spent-label");
    amountSpentLabel.style.color = currentRankObj.color;
    progressElement.insertAdjacentElement('afterend', amountSpentLabel);

    recordDiagnostic('log', 'widget-injected', {
        currentRankName,
        currentRank: currentRankObj,
        nextRank: nextRankObj,
        currentPercentage,
        amountRequired,
        amountSpent,
        progressElement: summarizeElement(progressElement),
        percentageElement: summarizeElement(percentageElement)
    });
}

function getDebugSnapshot() {
    const progressElements = findProgressElements();
    const vipCandidates = uniqueElements(queryAllSafe(document, DIAGNOSTIC_CANDIDATE_SELECTOR));
    const manifest = getExtensionManifest();

    return {
        capturedAt: new Date().toISOString(),
        extension: {
            name: manifest?.name ?? 'Stake.com VIP Rank Progress',
            version: manifest?.version ?? null
        },
        href: window.location.href,
        title: document.title,
        userAgent: navigator.userAgent,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        },
        readyState: document.readyState,
        bodyExists: Boolean(document.body),
        scanCount,
        selectors: {
            vipWidget: VIP_WIDGET_SELECTOR,
            progress: PROGRESS_SELECTORS,
            candidates: DIAGNOSTIC_CANDIDATE_SELECTOR
        },
        selectorCounts: PROGRESS_SELECTORS.map(selector => ({
            selector,
            count: queryAllSafe(document, selector).length
        })),
        progressCount: progressElements.length,
        progressElements: progressElements.slice(0, 20).map(summarizeElement),
        vipCandidates: vipCandidates.slice(0, 40).map(summarizeElement),
        recentDiagnosticEvents: diagnosticEvents.slice(-40)
    };
}

function scanVipWidgets(reason = 'direct') {
    const progressElements = findProgressElements();
    const now = Date.now();
    scanCount += 1;

    if (progressElements.length !== lastProgressCount || now - lastScanEventAt > DIAGNOSTIC_SCAN_EVENT_INTERVAL_MS) {
        lastProgressCount = progressElements.length;
        lastScanEventAt = now;
        recordDiagnostic('log', 'scan', {
            reason,
            scanCount,
            progressCount: progressElements.length,
            readyState: document.readyState,
            href: window.location.href
        });
    }

    if (progressElements.length === 0) {
        if (now - lastNoProgressEventAt > DIAGNOSTIC_NO_PROGRESS_EVENT_INTERVAL_MS) {
            lastNoProgressEventAt = now;
            recordDiagnostic('warn', 'no-progress-elements-found', {
                href: window.location.href,
                selectorCounts: getDebugSnapshot().selectorCounts,
                hint: 'Open the Stake VIP/progress panel, then generate a bug report from the extension popup.'
            });
        }
        return;
    }

    progressElements.forEach(progressEl => {
        const widgetRoot = getWidgetRoot(progressEl);
        if (widgetRoot?.querySelector('.amount-spent-label')) {
            if (!loggedSkippedWidgets.has(progressEl)) {
                loggedSkippedWidgets.add(progressEl);
                recordDiagnostic('log', 'widget-already-injected-skipping', {
                    progressElement: summarizeElement(progressEl)
                });
            }
            return;
        }

        injectIntoWidget(progressEl);
    });
}

function scheduleMutationScan() {
    if (pendingMutationScan !== null) return;

    pendingMutationScan = window.setTimeout(() => {
        pendingMutationScan = null;
        scanVipWidgets('mutation');
    }, MUTATION_DEBOUNCE_MS);
}

function handleRuntimeMessage(message, sender, sendResponse) {
    if (!message || typeof message.type !== 'string') return false;

    if (message.type === 'STAKE_VIP_CREATE_BUG_REPORT') {
        scanVipWidgets('bug-report');
        sendResponse({
            ok: true,
            report: getDebugSnapshot()
        });
        return false;
    }

    return false;
}

getExtensionRuntime()?.onMessage?.addListener(handleRuntimeMessage);

const progressBarObserver = new MutationObserver(scheduleMutationScan);

function startObserver() {
    if (!document.body) {
        recordDiagnostic('warn', 'document-body-not-ready-waiting-for-domcontentloaded', {
            readyState: document.readyState
        });
        document.addEventListener('DOMContentLoaded', startObserver, { once: true });
        return;
    }

    recordDiagnostic('log', 'observer-started', {
        readyState: document.readyState,
        href: window.location.href
    });
    scanVipWidgets('startup');
    progressBarObserver.observe(document.body, { childList: true, subtree: true });
}

startObserver();
