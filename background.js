chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ enabled: true }, () => {
        console.log("Goon-Not enabled by default.");
    });
});
