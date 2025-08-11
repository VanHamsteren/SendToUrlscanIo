document.getElementById('save').addEventListener('click', async function () {
    const apiKey = document.getElementById('apiKey').value.trim();
    const visibility = document.getElementById('visibility').value;

    try {
        await browser.storage.sync.set({
            urlscanApiKey: apiKey,
            urlscanVisibility: visibility
        });
        showStatus('Settings saved successfully!', true);
    } catch (error) {
        showStatus('Error saving settings.', false);
        console.error('Storage Error:', error);
    }
});

// Load saved settings on startup
document.addEventListener('DOMContentLoaded', async function () {
    const result = await browser.storage.sync.get(['urlscanApiKey', 'urlscanVisibility']);
    if (result.urlscanApiKey) {
        document.getElementById('apiKey').value = result.urlscanApiKey;
    }
    if (result.urlscanVisibility) {
        document.getElementById('visibility').value = result.urlscanVisibility;
    }
});

function showStatus(message, success) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.style.color = success ? 'green' : 'red';
}
