const toggle = document.getElementById("enabledToggle");

chrome.storage.sync.get("enabled", (data) => {
    toggle.checked = data.enabled;
});

toggle.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
});
