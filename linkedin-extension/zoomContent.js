/**
 * Comedia Task Agent - Zoom Web Processor
 * Injects into Zoom Web Client to capture captions via heuristics
 */

let isRecording = false;
let transcriptBuffer = [];
let lastProcessedTime = Date.now();
let meetingTitle = "Zoom Meeting";
let observer = null;
let silenceTimer = null;

// UI Overlay
let statusOverlay = null;

console.log('[Comedia Agent] Zoom Content Script Loaded');

// Initialize
function init() {
    createOverlay();
    // Wait for Zoom to fully load
    setTimeout(checkForCaptions, 3000);

    // Try to get meeting title
    const titleEl = document.querySelector('.meeting-info-title') || document.title;
    if (titleEl) {
        meetingTitle = typeof titleEl === 'string' ? titleEl : titleEl.textContent;
    }
}

// Create a visual indicator
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

// Smart Caption Detection
function checkForCaptions() {
    // Logic: Zoom captions appear in a container that:
    // 1. Often has class related to "caption" or "subtitle"
    // 2. Or is an aria-live region
    // 3. Or simply injects text rapidly at the bottom of the screen

    const targetNode = document.body;

    observer = new MutationObserver((mutations) => {
        let activityDetected = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    // Check if it looks like a caption
                    if (isCaptionNode(node)) {
                        const text = node.textContent?.trim();
                        if (text && text.length > 3) {
                            if (!transcriptBuffer.length || transcriptBuffer[transcriptBuffer.length - 1] !== text) {
                                transcriptBuffer.push(text);
                                activityDetected = true;

                                // Reset silence timer
                                if (silenceTimer) clearTimeout(silenceTimer);
                                if (!isRecording) {
                                    isRecording = true;
                                    updateStatus(true);
                                }

                                // Set silence timer to detect end of speech
                                silenceTimer = setTimeout(() => {
                                    isRecording = false;
                                    updateStatus(false, 'Waiting for speech...');
                                    processBuffer(); // Send on silence
                                }, 5000);
                            }
                        }
                    }
                });
            }
            // Also check characterData changes for updating captions
            else if (mutation.type === 'characterData') {
                if (isCaptionNode(mutation.target.parentElement)) {
                    // handle updates
                    activityDetected = true;
                }
            }
        });
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Backup flush
    setInterval(processBuffer, 30000);
}

function isCaptionNode(node) {
    if (!node || !node.parentElement) return false;

    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    // 1. Check classes
    const className = (el.className || '').toString().toLowerCase();
    if (className.includes('caption') || className.includes('subtitle') || className.includes('transcript')) {
        return true;
    }

    // 2. Check accessibility roles
    if (el.getAttribute('aria-live') === 'polite' || el.getAttribute('role') === 'log') {
        return true;
    }

    // 3. Heuristic: Is it at the bottom middle?
    // (Expensive to check rects constantly, use sparingly or check parent style)
    const style = window.getComputedStyle(el);
    if (style.position === 'absolute' || style.position === 'fixed') {
        if (parseInt(style.bottom) < 200) return true;
    }

    // Specific Zoom Web containers (observed in wild)
    if (el.closest('.ax-outline') || el.closest('#wc-footer')) {
        // These are sometimes containers, check deeper
    }

    return false;
}

// Send accumulated text to backend
async function processBuffer() {
    if (transcriptBuffer.length === 0) return;

    const textToSend = transcriptBuffer.join(' ');
    transcriptBuffer = [];

    console.log('[Comedia Agent] Sending Zoom transcript:', textToSend.length, 'chars');

    try {
        chrome.runtime.sendMessage({
            type: 'PROCESS_MEETING_TRANSCRIPT',
            payload: {
                meetingTitle: meetingTitle,
                transcript: textToSend,
                speakers: [], // Hard to get from Zoom web
                timestamp: new Date().toISOString(),
                sourceType: 'zoom'
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

function flashSuccess() {
    const originalColor = statusOverlay.style.background;
    statusOverlay.style.background = '#3b82f6'; // Blue flash
    setTimeout(() => {
        statusOverlay.style.background = '#0f172a';
    }, 500);
}

// Start
init();
