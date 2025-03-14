// Function to send the URL to urlscan.io
async function sendToUrlscan(url) {
    const apiEndpoint = 'https://urlscan.io/api/v1/scan/';
    try {
        const { urlscanApiKey: apiKey } = await browser.storage.sync.get(
            'urlscanApiKey'
        );
        const { urlscanVisibility: visibility } =
            await browser.storage.sync.get('urlscanVisibility');

        if (!apiKey) {
            notifyUser(
                'Error',
                'No API key set. Please configure the extension.'
            );
            console.error('No API key set. Please configure the extension.');
            return;
        }

        if (!visibility) {
            notifyUser(
                'Error',
                'No visibility set. Please configure the extension.'
            );
            console.error('No visibility set. Please configure the extension.');
            return;
        }

        console.log('Using API Key:', apiKey);

        const payload = {
            url: url,
            visibility: visibility,
            tags: ['demotag1', 'demotag2'], // Example tags
        };

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'API-Key': apiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const status = errorData.status; // Get the status code
            const errorMessage = errorData.message || 'Unknown error occurred';
            const errorDescription =
                errorData.description || 'No description available';

            // Notify user with detailed error information
            notifyUser(
                'Error',
                `Error (${status}) - ${errorMessage}\n${errorDescription}`
            );
            console.error('Scan submission failed:', errorData);
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Scan submission successful:', data);
        notifyUser('Success', 'Scan submission successful!');

        if (data?.uuid) {
            pollForScanResult(data.uuid, apiKey);
        }
    } catch (error) {
        // If the error is an object with a status, message, and description
        if (error instanceof Error && error.message) {
            const status = error.status || 'Unknown';
            const message = error.message || 'An error occurred';
            const description = error.description || 'No description available';

            notifyUser(
                `Error (${status})`,
                `Error: ${message}\n${description}`
            );
        } else {
            // Fallback for unexpected error types
            notifyUser(
                'Error',
                `An unexpected error occurred: ${error.message}`
            );
        }
        console.error('Error:', error);
    }
}

async function pollForScanResult(uuid, apiKey) {
    const resultEndpoint = `https://urlscan.io/api/v1/result/${uuid}/`;

    const checkScan = async () => {
        try {
            const response = await fetch(resultEndpoint, {
                headers: {
                    'API-Key': apiKey,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const resultUrl = `https://urlscan.io/result/${uuid}/`;
                browser.tabs.create({ url: resultUrl });
            } else if (response.status === 404) {
                console.log('Scan in progress, polling again...');
                setTimeout(checkScan, 2000); // Poll again in 2 seconds
            } else {
                const errorText = await response.text();
                notifyUser(
                    'Error',
                    `Error fetching scan result: ${response.status} - ${errorText}`
                );
                console.error('Error fetching scan result:', response);
                console.error('Response body:', errorText);
            }
        } catch (error) {
            notifyUser('Error', `Error during polling: ${error.message}`);
            console.error('Error during polling:', error);
        }
    };

    setTimeout(checkScan, 10000); // Start polling after 10 seconds
}

// Function to notify the user
function notifyUser(title, message) {
    browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/urlscan_32.png', // Change to your icon path
        title: title,
        message: message,
        priority: 2,
    });
}

// Listener for context menu clicks
browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === 'sendToUrlscan' && info.linkUrl) {
        sendToUrlscan(info.linkUrl);
    }
});

// Create the context menu
browser.contextMenus.create({
    id: 'sendToUrlscan',
    title: 'Send to urlscan.io',
    contexts: ['link'],
    icons: {
        16: 'icons/urlscan_16.png',
        32: 'icons/urlscan_32.png',
    },
});
