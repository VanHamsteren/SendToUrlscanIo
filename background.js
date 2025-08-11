async function sendToUrlscan(url) {
    const API_ENDPOINT = 'https://urlscan.io/api/v1/scan/';
    
    try {
        // Load settings in one call
        const { urlscanApiKey: apiKey, urlscanVisibility: visibility } = 
            await browser.storage.sync.get(['urlscanApiKey', 'urlscanVisibility']);

        if (!apiKey || !visibility) {
            notifyError('Missing Configuration', 'Set API key and visibility in the extension options.');
            return;
        }

        const payload = {
            url,
            visibility,
            tags: ['demotag1', 'demotag2']
        };

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'API-Key': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            notifyError(
                `API Error (${response.status})`,
                errorData.message || 'Unknown error from urlscan.io'
            );
            throw new Error(errorData.message || 'Scan submission failed');
        }

        const data = await response.json();
        notifySuccess('Scan submitted successfully!');
        
        if (data.uuid) {
            pollForScanResult(data.uuid, apiKey);
        }

    } catch (error) {
        notifyError('Unexpected Error', error.message || 'An unexpected error occurred');
        console.error(error);
    }
}

// Poll scan result until available
function pollForScanResult(uuid, apiKey) {
    const RESULT_ENDPOINT = `https://urlscan.io/api/v1/result/${uuid}/`;

    let attempts = 0;
    const MAX_ATTEMPTS = 15; // Stop after ~30s (2s interval + 10s initial delay)

    const intervalId = setInterval(async () => {
        attempts++;
        try {
            const response = await fetch(RESULT_ENDPOINT, {
                headers: { 'API-Key': apiKey }
            });

            if (response.ok) {
                clearInterval(intervalId);
                browser.tabs.create({ url: `https://urlscan.io/result/${uuid}/` });
            } else if (response.status === 404) {
                console.log(`Scan not ready yet (attempt ${attempts})...`);
                if (attempts >= MAX_ATTEMPTS) {
                    clearInterval(intervalId);
                    notifyError('Timeout', 'Scan did not complete in time.');
                }
            } else {
                clearInterval(intervalId);
                const text = await response.text();
                notifyError(`Error ${response.status}`, text);
            }
        } catch (error) {
            clearInterval(intervalId);
            notifyError('Polling Error', error.message);
        }
    }, 2000);

    // Start polling after 10 seconds delay
    setTimeout(() => intervalId, 10000);
}

// ---- Notification Helpers ----
function notifyUser(title, message) {
    browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/urlscan_32.png',
        title,
        message,
        priority: 2
    });
}

function notifySuccess(message) {
    notifyUser('Success', message);
}

function notifyError(title, message) {
    notifyUser(title, message);
}

// ---- Context Menu Setup ----
browser.contextMenus.create({
    id: 'sendToUrlscan',
    title: 'Send to urlscan.io',
    contexts: ['link'],
    icons: {
        16: 'icons/urlscan_16.png',
        32: 'icons/urlscan_32.png'
    }
});

browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === 'sendToUrlscan' && info.linkUrl) {
        sendToUrlscan(info.linkUrl);
    }
});
