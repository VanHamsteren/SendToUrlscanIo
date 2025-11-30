/* global browser */
/**
 * URLScan.io & NextDNS Firefox Extension - Background Service Worker
 * Handles security tool integrations and context menu management
 */

// Store profiles for menu creation
let nextDnsProfiles = [];

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
            notifyError('URLScan Configuration Missing', 'Please set your API key and visibility in the extension options.');
            return;
        }

        // Validate API key format (basic check)
        if (apiKey.length < 20) {
            notifyError('Invalid URLScan API Key', 'The API key appears to be invalid. Please check your settings.');
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
                `URLScan API Error (${response.status})`,
                errorMessage
            );
            console.error('URLScan API Error:', errorData);
            return;
        }

        const data = await response.json();
        notifySuccess('URLScan submitted successfully! Opening results soon...');
        
        // Start polling for results
        if (data.uuid) {
            pollForScanResult(data.uuid, apiKey);
        } else {
            notifyError('Invalid Response', 'Did not receive a scan UUID from urlscan.io');
        }

    } catch (error) {
        console.error('URLScan unexpected error:', error);
        notifyError('URLScan Error', error.message || 'An unexpected error occurred. Please try again.');
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
                console.log(`URLScan completed successfully: ${uuid}`);
            } else if (response.status === 404) {
                // Scan not ready yet
                console.log(`URLScan not ready yet (attempt ${attempts}/${MAX_ATTEMPTS})...`);
                
                if (attempts >= MAX_ATTEMPTS) {
                    clearInterval(intervalId);
                    notifyError(
                        'URLScan Timeout', 
                        'The scan is taking longer than expected. You can check results manually at urlscan.io.'
                    );
                }
            } else {
                // Other error
                clearInterval(intervalId);
                const errorText = await response.text().catch(() => 'Unknown error');
                notifyError(
                    `URLScan Polling Error (${response.status})`, 
                    errorText
                );
                console.error('URLScan polling error:', response.status, errorText);
            }
        } catch (error) {
            clearInterval(intervalId);
            console.error('URLScan polling exception:', error);
            notifyError('Network Error', 'Failed to check URLScan results. Please check your connection.');
        }
    };

    // Start polling after initial delay
    setTimeout(() => {
        intervalId = setInterval(checkResults, POLL_INTERVAL);
    }, INITIAL_DELAY);
}

/**
 * Extract domain from URL or text
 * Handles special cases like URLScan.io result pages
 * @param {string} url - Full URL or text
 * @returns {string} Domain only
 */
function extractDomain(url) {
    try {
        // Check if this is a URLScan.io result page
        // Format: urlscan.io/domain/example.com or urlscan.io/result/UUID
        if (url.includes('urlscan.io/domain/')) {
            const match = url.match(/urlscan\.io\/domain\/([^\/\?#]+)/);
            if (match && match[1]) {
                console.log(`Extracted domain from URLScan: ${match[1]}`);
                return match[1];
            }
        }
        
        // If it's just a domain without protocol, return as-is
        if (!url.includes('://') && !url.includes('/')) {
            return url;
        }
        
        // Try to parse as URL
        const urlObj = new URL(url.includes('://') ? url : `https://${url}`);
        return urlObj.hostname;
    } catch (error) {
        // If URL parsing fails, try to extract domain-like pattern
        const domainMatch = url.match(/([a-z0-9-]+\.)+[a-z]{2,}/i);
        if (domainMatch) {
            console.log(`Extracted domain via regex: ${domainMatch[0]}`);
            return domainMatch[0];
        }
        console.error('Failed to extract domain:', error);
        return url;
    }
}

/**
 * Add domain to NextDNS list (blocklist or allowlist)
 * @param {string} profileId - NextDNS profile ID
 * @param {string} profileName - Profile name for display
 * @param {string} domain - Domain to add
 * @param {string} listType - 'denylist' or 'allowlist'
 */
async function addToNextDnsList(profileId, profileName, domain, listType) {
    try {
        const { nextdnsApiKey: apiKey } = await browser.storage.sync.get(['nextdnsApiKey']);

        if (!apiKey) {
            notifyError('NextDNS Configuration Missing', 'Please set your NextDNS API key in the extension options.');
            return;
        }

        // NextDNS API endpoint - POST to add domain to list
        const endpoint = `https://api.nextdns.io/profiles/${profileId}/${listType}`;
        
        console.log(`Calling NextDNS API: POST ${endpoint} with domain: ${domain}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: domain,
                active: true
            })
        });

        console.log(`NextDNS API response: ${response.status}`);

        if (response.ok || response.status === 201 || response.status === 204) {
            const listName = listType === 'denylist' ? 'blocklist' : 'allowlist';
            notifySuccess(`NextDNS: Added "${domain}" to ${listName} in profile "${profileName}"`);
            console.log(`NextDNS: Successfully added ${domain} to ${listType} in profile ${profileId}`);
        } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            notifyError(
                `NextDNS API Error: ${response.status}`,
                errorText || 'Failed to add domain to list'
            );
            console.error('NextDNS API Error:', response.status, errorText);
        }

    } catch (error) {
        console.error('NextDNS unexpected error:', error);
        notifyError('NextDNS Error', error.message || 'An unexpected error occurred.');
    }
}

/**
 * Fetch NextDNS profiles for the user
 * @returns {Array} Array of profile objects
 */
async function fetchNextDnsProfiles() {
    try {
        const { nextdnsApiKey: apiKey } = await browser.storage.sync.get(['nextdnsApiKey']);

        if (!apiKey) {
            console.log('NextDNS API key not configured in storage');
            return [];
        }

        console.log('Fetching NextDNS profiles with API key length:', apiKey.length);
        
        const response = await fetch('https://api.nextdns.io/profiles', {
            headers: {
                'X-Api-Key': apiKey
            }
        });

        console.log('NextDNS API response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            const profiles = data.data || [];
            console.log('NextDNS profiles fetched successfully:', profiles.length, 'profiles');
            if (profiles.length > 0) {
                console.log('Profile names:', profiles.map(p => p.name || p.id).join(', '));
            }
            return profiles;
        } else {
            const errorText = await response.text().catch(() => 'No error text');
            console.error('Failed to fetch NextDNS profiles. Status:', response.status, 'Error:', errorText);
            return [];
        }

    } catch (error) {
        console.error('Exception while fetching NextDNS profiles:', error.message, error);
        return [];
    }
}

/**
 * Create context menus based on available integrations
 */
async function createContextMenus() {
    try {
        // Remove all existing menus
        await browser.contextMenus.removeAll();
        console.log('Creating context menus...');

        // Contexts where menus should appear: links and selected text
        const contexts = ['link', 'selection'];

        // Create parent "Security" menu
        browser.contextMenus.create({
            id: 'security-parent',
            title: 'Security Analysis',
            contexts: contexts
        });

        // Add URLScan.io option
        browser.contextMenus.create({
            id: 'urlscan-submit',
            parentId: 'security-parent',
            title: 'Scan with URLScan.io',
            contexts: ['link'],
            icons: {
                16: 'icons/urlscan_16.png'
            }
        });

        // Fetch NextDNS profiles
        nextDnsProfiles = await fetchNextDnsProfiles();
        console.log(`Fetched ${nextDnsProfiles.length} NextDNS profiles`);

        if (nextDnsProfiles.length > 0) {
            // Create NextDNS parent menu
            browser.contextMenus.create({
                id: 'nextdns-parent',
                parentId: 'security-parent',
                title: 'NextDNS',
                contexts: contexts
            });

            // Create "Add to blocklist" submenu
            browser.contextMenus.create({
                id: 'nextdns-blocklist',
                parentId: 'nextdns-parent',
                title: '🚫 Add to Blocklist',
                contexts: contexts
            });

            // Create "Add to allowlist" submenu
            browser.contextMenus.create({
                id: 'nextdns-allowlist',
                parentId: 'nextdns-parent',
                title: '✓ Add to Allowlist',
                contexts: contexts
            });

            // Add profile options for blocklist
            console.log('Creating blocklist profile menus...');
            for (const profile of nextDnsProfiles) {
                try {
                    browser.contextMenus.create({
                        id: `nextdns-blocklist-${profile.id}`,
                        parentId: 'nextdns-blocklist',
                        title: profile.name || profile.id,
                        contexts: contexts
                    });
                    console.log(`  ✓ Created blocklist menu for: ${profile.name || profile.id}`);
                } catch (err) {
                    console.error(`  ✗ Failed to create blocklist menu for ${profile.id}:`, err);
                }
            }

            // Add profile options for allowlist
            console.log('Creating allowlist profile menus...');
            for (const profile of nextDnsProfiles) {
                try {
                    browser.contextMenus.create({
                        id: `nextdns-allowlist-${profile.id}`,
                        parentId: 'nextdns-allowlist',
                        title: profile.name || profile.id,
                        contexts: contexts
                    });
                    console.log(`  ✓ Created allowlist menu for: ${profile.name || profile.id}`);
                } catch (err) {
                    console.error(`  ✗ Failed to create allowlist menu for ${profile.id}:`, err);
                }
            }

            console.log(`✓ Created NextDNS menus for ${nextDnsProfiles.length} profiles`);
        } else {
            console.log('No NextDNS profiles found (API key may not be configured)');
        }

        // Add separator and future tools hint
        browser.contextMenus.create({
            id: 'separator',
            parentId: 'security-parent',
            type: 'separator',
            contexts: contexts
        });

        browser.contextMenus.create({
            id: 'more-tools',
            parentId: 'security-parent',
            title: '⚙️ Configure Tools',
            contexts: contexts
        });

        console.log('✓ Context menus created successfully');
    } catch (error) {
        console.error('Error creating context menus:', error);
    }
}

/**
 * Handle context menu clicks
 */
browser.contextMenus.onClicked.addListener(async (info) => {
    const menuItemId = info.menuItemId;
    const linkUrl = info.linkUrl;

    if (!linkUrl) return;

    // URLScan.io
    if (menuItemId === 'urlscan-submit') {
        console.log('Scanning URL:', linkUrl);
        sendToUrlscan(linkUrl);
    }
    // NextDNS blocklist
    else if (menuItemId.startsWith('nextdns-blocklist-')) {
        const profileId = menuItemId.replace('nextdns-blocklist-', '');
        const profile = nextDnsProfiles.find(p => p.id === profileId);
        const domain = extractDomain(linkUrl);
        console.log(`Adding ${domain} to blocklist for profile ${profileId}`);
        addToNextDnsList(profileId, profile?.name || profileId, domain, 'denylist');
    }
    // NextDNS allowlist
    else if (menuItemId.startsWith('nextdns-allowlist-')) {
        const profileId = menuItemId.replace('nextdns-allowlist-', '');
        const profile = nextDnsProfiles.find(p => p.id === profileId);
        const domain = extractDomain(linkUrl);
        console.log(`Adding ${domain} to allowlist for profile ${profileId}`);
        addToNextDnsList(profileId, profile?.name || profileId, domain, 'allowlist');
    }
    // Configure tools
    else if (menuItemId === 'more-tools') {
        browser.runtime.openOptionsPage();
    }
});

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

// ---- Toolbar Button Action ----
// Open options page when toolbar icon is clicked
browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
});

// ---- Message Handling for Options Page ----
// Handle messages from options page (for testing API connection)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'testNextDnsConnection') {
        // Test NextDNS API connection
        (async () => {
            try {
                const apiKey = message.apiKey;
                if (!apiKey) {
                    sendResponse({ success: false, error: 'No API key provided' });
                    return;
                }

                const response = await fetch('https://api.nextdns.io/profiles', {
                    headers: { 'X-Api-Key': apiKey }
                });

                if (response.ok) {
                    const data = await response.json();
                    const profiles = data.data || [];
                    sendResponse({ 
                        success: true, 
                        profiles: profiles,
                        count: profiles.length 
                    });
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    sendResponse({ 
                        success: false, 
                        error: `HTTP ${response.status}: ${errorText}`,
                        status: response.status
                    });
                }
            } catch (error) {
                sendResponse({ 
                    success: false, 
                    error: error.message 
                });
            }
        })();
        return true; // Keep message channel open for async response
    }
    
    if (message.action === 'fetchProfiles') {
        // Fetch profiles and rebuild menus
        (async () => {
            await createContextMenus();
            sendResponse({ success: true });
        })();
        return true;
    }
});

// ---- Extension Initialization ----
// Create context menus on extension load
createContextMenus();

// Listen for storage changes to update menus dynamically
browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
        // Recreate menus if any relevant setting changed
        if (changes.nextdnsApiKey || changes.urlscanApiKey) {
            console.log('Settings changed, recreating menus...');
            // Small delay to ensure storage is updated
            setTimeout(() => {
                createContextMenus();
            }, 500);
        }
    }
});

console.log('Security Analysis extension loaded successfully');