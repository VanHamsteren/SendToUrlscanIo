/* global browser */
/**
 * Security Tools Extension - Options Page Script
 * Handles settings management and user interactions
 */

// Default configuration values
const DEFAULTS = {
    tags: 'firefox, extension',
    visibility: 'unlisted'
};

// DOM Elements
const form = document.getElementById('settingsForm');
const apiKeyInput = document.getElementById('apiKey');
const visibilitySelect = document.getElementById('visibility');
const tagsInput = document.getElementById('tags');
const nextdnsApiKeyInput = document.getElementById('nextdnsApiKey');
const saveButton = document.getElementById('save');
const resetButton = document.getElementById('reset');
const togglePasswordBtn = document.getElementById('toggleApiKey');
const toggleNextDnsBtn = document.getElementById('toggleNextDnsKey');
const testNextDnsBtn = document.getElementById('testNextDns');
const statusDiv = document.getElementById('status');
const apiKeyError = document.getElementById('apiKeyError');
const nextdnsKeyError = document.getElementById('nextdnsKeyError');
const profilesInfo = document.getElementById('profilesInfo');
const profilesList = document.getElementById('profilesList');

/**
 * Validate API key format
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if valid
 */
function validateApiKey(apiKey) {
    const trimmed = apiKey.trim();
    // Basic validation: non-empty and reasonable length
    return trimmed.length >= 20;
}

/**
 * Show status message to user
 * @param {string} message - Message to display
 * @param {boolean} isSuccess - Whether this is a success or error message
 */
function showStatus(message, isSuccess) {
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'show success' : 'show error';
    statusDiv.setAttribute('data-testid', isSuccess ? 'status-success' : 'status-error');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.classList.remove('show');
    }, 5000);
}

/**
 * Show validation error for a field
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} errorElement - Error message element
 * @param {boolean} show - Whether to show or hide error
 */
function showFieldError(input, errorElement, show) {
    if (show) {
        input.classList.add('error');
        errorElement.classList.add('show');
    } else {
        input.classList.remove('error');
        errorElement.classList.remove('show');
    }
}

/**
 * Fetch and display NextDNS profiles via background script
 */
async function fetchAndDisplayProfiles() {
    const apiKey = nextdnsApiKeyInput.value.trim();
    
    if (!apiKey) {
        profilesInfo.classList.remove('show');
        return;
    }

    try {
        // Send message to background script to test connection
        const response = await browser.runtime.sendMessage({
            action: 'testNextDnsConnection',
            apiKey: apiKey
        });

        if (response.success && response.profiles.length > 0) {
            profilesList.innerHTML = response.profiles
                .map(p => `<li>• ${p.name || p.id} (${p.id})</li>`)
                .join('');
            profilesInfo.classList.add('show');
        } else {
            profilesInfo.classList.remove('show');
        }
    } catch (error) {
        console.error('Error fetching profiles via background:', error);
        profilesInfo.classList.remove('show');
    }
}

/**
 * Toggle API key visibility
 */
togglePasswordBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
});

/**
 * Toggle NextDNS key visibility
 */
toggleNextDnsBtn.addEventListener('click', () => {
    const isPassword = nextdnsApiKeyInput.type === 'password';
    nextdnsApiKeyInput.type = isPassword ? 'text' : 'password';
    toggleNextDnsBtn.textContent = isPassword ? 'Hide' : 'Show';
});

/**
 * Test NextDNS connection via background script
 */
testNextDnsBtn.addEventListener('click', async () => {
    const apiKey = nextdnsApiKeyInput.value.trim();
    
    if (!apiKey) {
        showStatus('⚠️ Please enter a NextDNS API key first', false);
        return;
    }
    
    // Show loading state
    const originalText = testNextDnsBtn.textContent;
    testNextDnsBtn.disabled = true;
    testNextDnsBtn.innerHTML = '<span class="loading"></span> Testing...';
    
    try {
        console.log('Testing NextDNS API connection via background script...');
        
        // Send message to background script
        const response = await browser.runtime.sendMessage({
            action: 'testNextDnsConnection',
            apiKey: apiKey
        });
        
        if (response.success) {
            const profiles = response.profiles;
            
            if (profiles.length > 0) {
                showStatus(`✓ Connection successful! Found ${profiles.length} profile(s): ${profiles.map(p => p.name || p.id).join(', ')}`, true);
                console.log('NextDNS profiles:', profiles);
                
                // Display profiles
                profilesList.innerHTML = profiles
                    .map(p => `<li>• ${p.name || p.id} (${p.id})</li>`)
                    .join('');
                profilesInfo.classList.add('show');
            } else {
                showStatus('⚠️ Connection successful but no profiles found. Create a profile at nextdns.io', false);
            }
        } else {
            showStatus(`✗ Connection failed: ${response.error}. Check your API key.`, false);
            console.error('NextDNS API error:', response);
        }
    } catch (error) {
        showStatus(`✗ Error: ${error.message}`, false);
        console.error('NextDNS connection error:', error);
    } finally {
        testNextDnsBtn.disabled = false;
        testNextDnsBtn.textContent = originalText;
    }
});

/**
 * Handle form submission
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Trim all inputs to remove whitespace
    const apiKey = apiKeyInput.value.trim();
    const visibility = visibilitySelect.value;
    const tags = tagsInput.value.trim();
    const nextdnsApiKey = nextdnsApiKeyInput.value.trim();

    // Update input fields with trimmed values
    apiKeyInput.value = apiKey;
    nextdnsApiKeyInput.value = nextdnsApiKey;

    // Validate URLScan API key if provided
    if (apiKey && !validateApiKey(apiKey)) {
        showFieldError(apiKeyInput, apiKeyError, true);
        showStatus('Please enter a valid URLScan.io API key (minimum 20 characters)', false);
        return;
    }
    
    showFieldError(apiKeyInput, apiKeyError, false);
    showFieldError(nextdnsApiKeyInput, nextdnsKeyError, false);

    // Show loading state
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="loading"></span> Saving...';

    try {
        // Save to browser storage
        await browser.storage.sync.set({
            urlscanApiKey: apiKey,
            urlscanVisibility: visibility,
            urlscanTags: tags || DEFAULTS.tags,
            nextdnsApiKey: nextdnsApiKey
        });
        
        showStatus('✓ All settings saved successfully! Context menu will update shortly.', true);
        console.log('Settings saved:', { visibility, tags: tags || DEFAULTS.tags, hasNextDns: !!nextdnsApiKey });
        
        // Fetch profiles if NextDNS key is set
        if (nextdnsApiKey) {
            await fetchAndDisplayProfiles();
        } else {
            profilesInfo.classList.remove('show');
        }
    } catch (error) {
        console.error('Storage Error:', error);
        showStatus('✗ Error saving settings. Please try again.', false);
    } finally {
        // Restore button state
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
});

/**
 * Reset settings to defaults
 */
resetButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to defaults? Your API keys will be kept.')) {
        visibilitySelect.value = DEFAULTS.visibility;
        tagsInput.value = DEFAULTS.tags;
        showStatus('Settings reset to defaults. Click Save to apply.', true);
    }
});

/**
 * Real-time validation for URLScan API key
 */
apiKeyInput.addEventListener('input', () => {
    if (apiKeyInput.value.trim().length > 0) {
        const isValid = validateApiKey(apiKeyInput.value);
        showFieldError(apiKeyInput, apiKeyError, !isValid);
    } else {
        showFieldError(apiKeyInput, apiKeyError, false);
    }
});

/**
 * Real-time profile fetching for NextDNS
 */
let fetchTimeout;
nextdnsApiKeyInput.addEventListener('input', () => {
    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(() => {
        fetchAndDisplayProfiles();
    }, 1000); // Debounce by 1 second
});

/**
 * Load saved settings when page loads
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const result = await browser.storage.sync.get([
            'urlscanApiKey',
            'urlscanVisibility',
            'urlscanTags',
            'nextdnsApiKey'
        ]);
        
        // Populate form with saved values
        if (result.urlscanApiKey) {
            apiKeyInput.value = result.urlscanApiKey;
        }
        
        if (result.urlscanVisibility) {
            visibilitySelect.value = result.urlscanVisibility;
        } else {
            visibilitySelect.value = DEFAULTS.visibility;
        }
        
        if (result.urlscanTags) {
            tagsInput.value = result.urlscanTags;
        } else {
            tagsInput.value = DEFAULTS.tags;
        }
        
        if (result.nextdnsApiKey) {
            nextdnsApiKeyInput.value = result.nextdnsApiKey;
            await fetchAndDisplayProfiles();
        }
        
        console.log('Settings loaded successfully');
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading saved settings', false);
    }
});

// Log initialization
console.log('Options page initialized');