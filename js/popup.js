const statusText = document.getElementById('statusText');
const reportButton = document.getElementById('reportButton');

let activeTab = null;

function setStatus(message) {
    statusText.textContent = message;
}

function queryActiveTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const error = chrome.runtime.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }

            resolve(tabs?.[0] ?? null);
        });
    });
}

function sendToActiveTab(message) {
    return new Promise((resolve, reject) => {
        if (!activeTab?.id) {
            reject(new Error('No active tab found.'));
            return;
        }

        chrome.tabs.sendMessage(activeTab.id, message, response => {
            const error = chrome.runtime.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }

            resolve(response);
        });
    });
}

function isStakeTab(tab) {
    try {
        const url = new URL(tab?.url ?? '');
        return url.protocol === 'https:' && url.hostname === 'stake.com';
    } catch (error) {
        return false;
    }
}

function getExtensionManifest() {
    return chrome.runtime.getManifest();
}

function makePopupReport(reason, extra = {}) {
    const manifest = getExtensionManifest();

    return {
        capturedAt: new Date().toISOString(),
        extension: {
            name: manifest.name,
            version: manifest.version
        },
        context: 'popup',
        reason,
        activeTab: activeTab ? {
            id: activeTab.id ?? null,
            url: activeTab.url ?? null,
            title: activeTab.title ?? null,
            status: activeTab.status ?? null
        } : null,
        userAgent: navigator.userAgent,
        ...extra
    };
}

function makeReportFilename(report) {
    const timestamp = (report?.capturedAt ?? new Date().toISOString())
        .replaceAll(':', '-')
        .replaceAll('.', '-');
    return `stake-vip-rank-progress-bug-report-${timestamp}.json`;
}

function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function refreshStatus() {
    try {
        activeTab = await queryActiveTab();
        setStatus(isStakeTab(activeTab)
            ? 'Ready.'
            : 'This tab is not stake.com. A context report can still be generated.');
    } catch (error) {
        setStatus(`Could not read active tab: ${error.message}`);
    }
}

reportButton.addEventListener('click', async () => {
    reportButton.disabled = true;
    setStatus('Generating JSON report...');

    try {
        activeTab = await queryActiveTab();

        if (!isStakeTab(activeTab)) {
            const report = makePopupReport('not_stake_tab');
            const filename = makeReportFilename(report);

            downloadJson(filename, report);
            setStatus(`Downloaded ${filename}`);
            return;
        }

        let report;
        try {
            const response = await sendToActiveTab({ type: 'STAKE_VIP_CREATE_BUG_REPORT' });
            report = response?.report ?? response ?? makePopupReport('empty_content_script_response');
        } catch (error) {
            report = makePopupReport('stake_content_script_unavailable', {
                error: error.message
            });
        }

        const filename = makeReportFilename(report);
        downloadJson(filename, report);
        setStatus(`Downloaded ${filename}`);
    } catch (error) {
        const report = makePopupReport('popup_error', {
            error: error.message
        });
        const filename = makeReportFilename(report);

        try {
            downloadJson(filename, report);
            setStatus(`Downloaded ${filename}`);
        } catch (downloadError) {
            setStatus(`Could not generate report: ${downloadError.message}`);
        }
    } finally {
        reportButton.disabled = false;
    }
});

refreshStatus();
