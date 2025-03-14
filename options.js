// Function to save the API key to Firefox storage
document.getElementById('save').addEventListener('click', function () {
    const apiKey = document.getElementById('apiKey').value;
    const Visibility = document.getElementById('visibility').value;

    // Save the API key in storage
    browser.storage.sync
        .set({ urlscanApiKey: apiKey })
        .then(() => {
            document.getElementById('status').textContent = 'API Key saved!';
        })
        .catch((error) => {
            document.getElementById('status').textContent =
                'Error saving API Key.';
            console.error('Storage Error: ', error);
        });

    // Save the visibility setting in storage
    browser.storage.sync
        .set({ urlscanVisibility: Visibility })
        .then(() => {
            document.getElementById('status').textContent = 'Visibility saved!';
        })
        .catch((error) => {
            document.getElementById('status').textContent =
                'Error saving visibility.';
            console.error('Storage Error: ', error);
        });
});

// Function to load and display the saved API key
document.addEventListener('DOMContentLoaded', function () {
    browser.storage.sync.get('urlscanApiKey').then((result) => {
        if (result.urlscanApiKey) {
            document.getElementById('apiKey').value = result.urlscanApiKey;
        }
    });
    browser.storage.sync.get('urlscanVisibility').then((result) => {
        if (result.visibility) {
            document.getElementById('visibility').value = result.visibility;
        }
    });
});
