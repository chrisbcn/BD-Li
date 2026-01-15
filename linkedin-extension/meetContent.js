/**
 * Comedia Task Agent - Google Meet Processor
 * Injects into Google Meet to capture captions and extract tasks
 */

let isRecording = false;
let transcriptBuffer = [];
let lastProcessedTime = Date.now();
let meetingTitle = "Google Meet";
let observer = null;

// UI Overlay
let statusOverlay = null;

console.log('[Comedia Agent] Meet Content Script Loaded');

// Initialize
function init() {
    createOverlay();
    checkForCaptions();

    // Try to get meeting title
    const titleElement = document.querySelector('[data-meeting-title]');
    if (titleElement) {
        meetingTitle = titleElement.getAttribute('data-meeting-title');
    }
}

// Create a visual indicator on the screen
function createOverlay() {
    statusOverlay = document.createElement('div');
    statusOverlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #0f172a;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 9999;
    font-family: Inter, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    opacity: 0.8;
  `;

    statusOverlay.innerHTML = `
    <div id="comedia-status-dot" style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></div>
    <span id="comedia-status-text">Agent Inactive (Turn on Captions)</span>
  `;

    document.body.appendChild(statusOverlay);
}

// Update UI
function updateStatus(active, message) {
    const dot = statusOverlay.querySelector('#comedia-status-dot');
    const text = statusOverlay.querySelector('#comedia-status-text');

    if (active) {
        dot.style.background = '#22c55e'; // Green
        dot.style.boxShadow = '0 0 10px #22c55e';
        text.textContent = 'Agent Listening...';
    } else {
        dot.style.background = '#ef4444'; // Red
        dot.style.boxShadow = 'none';
        text.textContent = message || 'Agent Inactive (Turn on Captions)';
    }
}

// Watch for captions
function checkForCaptions() {
    // Google Meet captions usually appear in a div with jsname="tgaKEf" or similiar, 
    // but classes change. Best to look for the known caption container structure.
    // The structure is often: div[class*="a4cQT"] (caption container)

    // We'll use a MutationObserver on the body to find where text is being added rapidly

    observer = new MutationObserver((mutations) => {
        // Check if we are active
        const captionContainer = document.querySelector('.a4cQT') || document.querySelector('[jsname="tgaKEf"]');

        if (captionContainer) {
            if (!isRecording) {
                isRecording = true;
                updateStatus(true);
                console.log('[Comedia Agent] Captions detected, recording started');
            }

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        // Traverse down to find text
                        const textContent = node.textContent?.trim();
                        if (textContent && node.parentElement?.closest('.a4cQT, [jsname="tgaKEf"]')) {
                            // Get speaker name if available (often in a sibling or parent structure)
                            // This is tricky in Meet's obfuscated DOM, so for now we capture raw text

                            // Only add if it's a new unique sentence to avoid jitter/duplicates
                            if (!transcriptBuffer.length || transcriptBuffer[transcriptBuffer.length - 1] !== textContent) {
                                transcriptBuffer.push(textContent);
                            }
                        }
                    });
                }
            });

        } else {
            if (isRecording) {
                isRecording = false;
                updateStatus(false, 'Captions off');
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Send buffer periodically
    setInterval(processBuffer, 30000); // Check every 30 seconds
}

// Send accumulated text to backend
async function processBuffer() {
    if (transcriptBuffer.length === 0) return;

    const textToSend = transcriptBuffer.join(' ');
    // Clear buffer but keep slight overlap? No, simple flush for now.
    transcriptBuffer = [];

    console.log('[Comedia Agent] Sending transcript chunk:', textToSend.length, 'chars');

    try {
        const speakers = extractSpeakers(textToSend); // Simple heuristic

        chrome.runtime.sendMessage({
            type: 'PROCESS_MEETING_TRANSCRIPT',
            payload: {
                meetingTitle: meetingTitle || "Google Meet",
                transcript: textToSend,
                speakers: speakers,
                timestamp: new Date().toISOString()
            }
        }, (response) => {
            if (response && response.success) {
                flashSuccess();
            }
        });
    } catch (err) {
        console.error('Error sending transcript', err);
    }
}

// Simple helper to guess speakers (Format: "Name: text")
function extractSpeakers(text) {
    const speakerRegex = /([A-Z][a-z]+ [A-Z][a-z]+):/g;
    const found = [...text.matchAll(speakerRegex)];
    return [...new Set(found.map(m => m[1]))];
}

function flashSuccess() {
    const originalColor = statusOverlay.style.background;
    statusOverlay.style.background = '#3b82f6'; // Blue flash
    setTimeout(() => {
        statusOverlay.style.background = '#0f172a';
    }, 500);
}

// Start
init();
