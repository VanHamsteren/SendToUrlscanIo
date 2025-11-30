/* global browser */
/**
 * URLScan.io Firefox Extension - Background Service Worker
 * Handles URL scanning submissions and result polling
 */

/**
 * Submit a URL to urlscan.io for scanning
 * @param {string} url - The URL to scan
 */
async function sendToUrlscan(url) {
    const API_ENDPOINT = 'https://urlscan.io/api/v1/scan/';
    
    try {
        // Load settings from storage
        const { urlscanApiKey: apiKey, urlscanVisibility: visibility, urlscanTags: tags } = 
            await browser.storage.sync.get(['urlscanApiKey', 'urlscanVisibility', 'urlscanTags']);

        // Validate configuration
        if (!apiKey || !visibility) {
            notifyError('Missing Configuration', 'Please set your API key and visibility in the extension options.');
            return;
        }

        // Validate API key format (basic check)
        if (apiKey.length < 20) {
            notifyError('Invalid API Key', 'The API key appears to be invalid. Please check your settings.');
            return;
        }

        // Parse tags (default to firefox and extension if not set)
        let tagArray = ['firefox', 'extension'];
        if (tags && tags.trim()) {
            tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            if (tagArray.length === 0) {
                tagArray = ['firefox', 'extension'];
            }
        }

        const payload = {
            url,
            visibility,
            tags: tagArray
        };

        // Submit scan request
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
            const errorMessage = errorData.message || errorData.description || 'Unknown error from urlscan.io';
            notifyError(
                `API Error (${response.status})`,
                errorMessage
            );
            console.error('URLScan API Error:', errorData);
            return;
        }

        const data = await response.json();
        notifySuccess('Scan submitted successfully! Opening results soon...');
        
        // Start polling for results
        if (data.uuid) {
            pollForScanResult(data.uuid, apiKey);
        } else {
            notifyError('Invalid Response', 'Did not receive a scan UUID from urlscan.io');
        }

    } catch (error) {
        console.error('Unexpected error:', error);
        notifyError('Unexpected Error', error.message || 'An unexpected error occurred. Please try again.');
    }
}

/**
 * Poll the urlscan.io API for scan results
 * @param {string} uuid - The scan UUID
 * @param {string} apiKey - The API key for authentication
 */
function pollForScanResult(uuid, apiKey) {
    const RESULT_ENDPOINT = `https://urlscan.io/api/v1/result/${uuid}/`;
    const POLL_INTERVAL = 2000; // 2 seconds
    const INITIAL_DELAY = 10000; // 10 seconds initial delay
    const MAX_ATTEMPTS = 20; // Stop after 40 seconds of polling

    let attempts = 0;
    let intervalId = null;

    /**
     * Check if scan results are ready
     */
    const checkResults = async () => {
        attempts++;
        
        try {
            const response = await fetch(RESULT_ENDPOINT, {
                headers: { 'API-Key': apiKey }
            });

            if (response.ok) {
                // Results are ready!
                clearInterval(intervalId);
                await browser.tabs.create({ 
                    url: `https://urlscan.io/result/${uuid}/`,
                    active: true
                });
                console.log(`Scan completed successfully: ${uuid}`);
            } else if (response.status === 404) {
                // Scan not ready yet
                console.log(`Scan not ready yet (attempt ${attempts}/${MAX_ATTEMPTS})...`);
                
                if (attempts >= MAX_ATTEMPTS) {
                    clearInterval(intervalId);
                    notifyError(
                        'Scan Timeout', 
                        'The scan is taking longer than expected. You can check results manually at urlscan.io.'
                    );
                }
            } else {
                // Other error
                clearInterval(intervalId);
                const errorText = await response.text().catch(() => 'Unknown error');
                notifyError(
                    `Polling Error (${response.status})`, 
                    errorText
                );
                console.error('Polling error:', response.status, errorText);
            }
        } catch (error) {
            clearInterval(intervalId);
            console.error('Polling exception:', error);
            notifyError('Network Error', 'Failed to check scan results. Please check your connection.');
        }
    };

    // Start polling after initial delay
    setTimeout(() => {
        intervalId = setInterval(checkResults, POLL_INTERVAL);
    }, INITIAL_DELAY);
}

/**
 * Display a browser notification to the user
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function notifyUser(title, message) {
    browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/urlscan_32.png',
        title,
        message,
        priority: 2
    });
}

/**
 * Display a success notification
 * @param {string} message - Success message
 */
function notifySuccess(message) {
    notifyUser('✓ Success', message);
}

/**
 * Display an error notification
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function notifyError(title, message) {
    notifyUser(`✗ ${title}`, message);
}

// ---- Context Menu Setup ----
browser.contextMenus.create({
    id: 'sendToUrlscan',
    title: 'Scan with urlscan.io',
    contexts: ['link'],
    icons: {
        16: 'icons/urlscan_16.png',
        32: 'icons/urlscan_32.png'
    }
});

browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === 'sendToUrlscan' && info.linkUrl) {
        console.log('Scanning URL:', info.linkUrl);
        sendToUrlscan(info.linkUrl);
    }
});

// ---- Toolbar Button Action ----
// Open options page when toolbar icon is clicked
browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
});

console.log('URLScan.io extension loaded successfully');