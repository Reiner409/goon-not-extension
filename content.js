(async () => {
    const { enabled } = await chrome.storage.sync.get("enabled");
    if (!enabled) return;

    let lastUrl = location.href;

    const TOTAL_GIFS = 29;
    const TOTAL_AUDIOS = 2;

    const getRandomGifPath = () => {
        const index = Math.floor(Math.random() * TOTAL_GIFS) + 1;
        return chrome.runtime.getURL(`assets/gifs/${index}.gif`);
    };

    const suspiciousKeywords = ["porn", "nsfw", "xxx", "adult", "sex", "sesso", "nhentai", "trafficjunky"];

    const isSuspiciousText = (text) => {
        if (!text || text.length < 5) return false;

        const cleaned = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
        const rawLower = text.toLowerCase();
        const alphaRatio = cleaned.length / text.length;

        if (alphaRatio < 0.5 && !rawLower.includes("nhentai")) {
            return false;
        }

        for (const keyword of suspiciousKeywords) {
            const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, "i");
            const looseMatchRegex = new RegExp(`(?:\\W|^)${keyword}(?:\\W|$)`, "i");

            if (wordBoundaryRegex.test(cleaned) || looseMatchRegex.test(rawLower)) {
                console.log("🕵️ Suspicious text block:");
                console.log("• Original:", text.slice(0, 120).replace(/\n/g, " "));
                console.log("• Cleaned :", cleaned.slice(0, 120));
                console.log("• Alpha % :", alphaRatio.toFixed(2));
                console.log(`✅ Matched keyword (regex): "${keyword}"\n`);
                return true;
            }
        }

        return false;
    };






    // Replace media elements images
    const replaceMediaInElement = (container) => {
        //Substitute IMG
        container.querySelectorAll("img").forEach(el => {
            substituteImg(el);
        })

        //Substitute Videos
        container.querySelectorAll("video").forEach(el => {
            substituteVideo(el);
        })
    };

    const substituteImg = (el) => {
        if (el.dataset.goonNotReplaced) return;
        // console.log(el)
        // console.log(el.textContent)
        const replacement = document.createElement("img");
        replacement.src = getRandomGifPath();
        replacement.style.width = el.offsetWidth + "px";
        replacement.style.height = el.offsetHeight + "px";
        replacement.style.objectFit = "cover";
        replacement.alt = "Replaced media";

        el.replaceWith(replacement);
    }

    const substituteVideo = (el) => {
        if (el.dataset.goonNotReplaced) return;

        // Mute original video
        el.muted = true;
        el.pause(); // pause original video if you don't want to play it

        // Option 1: Play your audio separately
        const audioSrc = getRandomAudioPath();
        const customAudio = playAudio(audioSrc);

        // Optionally remove the video element and replace with GIF
        const replacement = document.createElement("img");
        replacement.src = getRandomGifPath();
        replacement.style.width = el.offsetWidth + "px";
        replacement.style.height = el.offsetHeight + "px";
        replacement.style.objectFit = "cover";

        el.replaceWith(replacement);

        // Store audio on replacement element to control later if needed
        replacement.customAudio = customAudio;
    }

    //Replace iframe elements

    const iframes = document.querySelectorAll('iframe');

    iframes.forEach(iframe => {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const text = doc.body ? doc.body.innerText || doc.body.textContent : "";
            if (text && suspiciousKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                // Replace or censor media inside iframe DOM
                // Example: replace images/videos inside this iframe's document
                const imgs = doc.querySelectorAll('img, video');
                imgs.forEach(el => {
                    const replacement = doc.createElement('img');
                    replacement.src = getRandomGifPath();
                    replacement.style.width = el.offsetWidth + 'px';
                    replacement.style.height = el.offsetHeight + 'px';
                    replacement.style.objectFit = 'cover';
                    el.replaceWith(replacement);
                });
            }
        } catch(e) {
            // Access denied: cross-origin iframe
            console.info('Cannot access iframe due to cross-origin restrictions:');
        }
    });

    // Recursive DOM traversal
    const scanAndReplace = (element) => {
        // Skip script, style, and irrelevant tags early
        const tag = element.tagName?.toLowerCase();

        if (["script", "style", "template", "noscript", "svg", "canvas", "code"].includes(tag)) return;

        // Skip invisible elements
        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return;

        // Check if element's text contains suspicious keywords
        if (isSuspiciousText(element.textContent || element.textContent)) {
            replaceMediaInElement(element);
        }

        // Recurse into children
        element.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                scanAndReplace(child);
            }
        });
    };

    // Run after page load (or after some delay to ensure content loads)
    window.addEventListener("load", () => {
        console.log(document.body);
        scanAndReplace(document.body);
    });



    const getRandomAudioPath = () => {
        const index = Math.floor(Math.random() * TOTAL_AUDIOS) + 1;
        return chrome.runtime.getURL(`assets/audio/${index}.mp3`);
    };

    const playAudio = (audioSrc) => {
        const audio = new Audio(audioSrc);
        audio.volume = 0.15;
        audio.loop = false;  // if you want looping
        audio.play().catch(err => console.info("Audio play failed:", err));
        return audio;
    };


    const checkUrlChange = () => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log("[Goon-Not] URL changed to", currentUrl);
            setTimeout(() => {
                scanAndReplace(document.body);
            }, 500); // delay to allow content to load
        }
    };

// Run scan initially
    scanAndReplace(document.body);

// Set up interval to check every 1 second
    setInterval(checkUrlChange, 500);

})();
