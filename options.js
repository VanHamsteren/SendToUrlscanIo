/* global browser */
/**
 * URLScan.io Extension - Options Page Script
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
const saveButton = document.getElementById('save');
const resetButton = document.getElementById('reset');
const togglePasswordBtn = document.getElementById('toggleApiKey');
const statusDiv = document.getElementById('status');
const apiKeyError = document.getElementById('apiKeyError');

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
 * Toggle API key visibility
 */
togglePasswordBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
});

/**
 * Handle form submission
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const apiKey = apiKeyInput.value.trim();
    const visibility = visibilitySelect.value;
    const tags = tagsInput.value.trim();

    // Validate API key
    if (!validateApiKey(apiKey)) {
        showFieldError(apiKeyInput, apiKeyError, true);
        showStatus('Please enter a valid API key (minimum 20 characters)', false);
        return;
    }
    
    showFieldError(apiKeyInput, apiKeyError, false);

    // Show loading state
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="loading"></span> Saving...';

    try {
        // Save to browser storage
        await browser.storage.sync.set({
            urlscanApiKey: apiKey,
            urlscanVisibility: visibility,
            urlscanTags: tags || DEFAULTS.tags
        });
        
        showStatus('✓ Settings saved successfully!', true);
        console.log('Settings saved:', { visibility, tags: tags || DEFAULTS.tags });
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
    if (confirm('Are you sure you want to reset all settings to defaults? Your API key will be kept.')) {
        visibilitySelect.value = DEFAULTS.visibility;
        tagsInput.value = DEFAULTS.tags;
        showStatus('Settings reset to defaults. Click Save to apply.', true);
    }
});

/**
 * Real-time validation for API key
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
 * Load saved settings when page loads
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const result = await browser.storage.sync.get([
            'urlscanApiKey',
            'urlscanVisibility',
            'urlscanTags'
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
        
        console.log('Settings loaded successfully');
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading saved settings', false);
    }
});

// Log initialization
console.log('Options page initialized');