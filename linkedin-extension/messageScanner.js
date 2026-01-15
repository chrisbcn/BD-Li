// LinkedIn Message Scanner
// Scans LinkedIn messages and extracts tasks using AI

// Check if we're on the messaging page
function isMessagingPage() {
  return window.location.pathname.includes('/messaging/');
}

const AUTO_SCAN_INTERVAL_MS = 120000; // 2 min
const AUTO_SCAN_COOLDOWN_MS = 300000; // 5 min per thread
const AUTO_SCAN_MIN_MESSAGES = 3;
const AUTO_SCAN_ENABLED_KEY = 'linkedin_auto_scan_enabled';
const AUTO_SCAN_STATE_KEY = 'linkedin_auto_scan_state';

let autoScanInFlight = false;
let scanBtnRef = null;
let statusElRef = null;
let autoScanToggleRef = null;
let autoScanIntervalId = null;

function isAutoScanEnabled() {
  const stored = localStorage.getItem(AUTO_SCAN_ENABLED_KEY);
  return stored !== 'false';
}

function setAutoScanEnabled(enabled) {
  localStorage.setItem(AUTO_SCAN_ENABLED_KEY, enabled ? 'true' : 'false');
  updateAutoScanToggle();
}

function updateAutoScanToggle() {
  if (!autoScanToggleRef) return;
  const enabled = isAutoScanEnabled();
  autoScanToggleRef.textContent = `Auto-scan: ${enabled ? 'On' : 'Off'}`;
}

function updateStatus(text, clearAfterMs = 0) {
  if (!statusElRef) return;
  statusElRef.textContent = text;
  if (clearAfterMs > 0) {
    setTimeout(() => {
      if (statusElRef && statusElRef.textContent === text) {
        statusElRef.textContent = '';
      }
    }, clearAfterMs);
  }
}

function setScanButtonState(disabled, text) {
  if (!scanBtnRef) return;
  scanBtnRef.disabled = disabled;
  if (text) {
    scanBtnRef.textContent = text;
  }
}

function computeHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return String(hash);
}

function loadAutoScanState() {
  try {
    const raw = localStorage.getItem(AUTO_SCAN_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAutoScanState(state) {
  try {
    localStorage.setItem(AUTO_SCAN_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

// Extract messages from the LinkedIn messaging interface
function extractMessages() {
  const messages = [];
  
  // Try to find message containers
  const messageSelectors = [
    '.msg-s-message-list__event',
    '[data-test-message-thread]',
    '.msg-s-event-listitem'
  ];

  let messageElements = [];
  for (const selector of messageSelectors) {
    messageElements = document.querySelectorAll(selector);
    if (messageElements.length > 0) break;
  }

  messageElements.forEach((msgEl, index) => {
    try {
      // Extract sender name
      const senderEl = msgEl.querySelector('.msg-s-message-group__profile-link, .msg-s-message-group__name a');
      const sender = senderEl ? senderEl.textContent.trim() : 'Unknown';

      // Extract message text
      const textEl = msgEl.querySelector('.msg-s-event-listitem__body, .msg-s-message-group__content p');
      const text = textEl ? textEl.textContent.trim() : '';

      // Extract timestamp
      const timeEl = msgEl.querySelector('time, .msg-s-message-group__timestamp');
      const timestamp = timeEl ? timeEl.getAttribute('datetime') || timeEl.textContent : new Date().toISOString();

      if (text && text.length > 0) {
        messages.push({
          id: `linkedin-msg-${index}`,
          sender,
          text,
          timestamp,
          url: window.location.href,
        });
      }
    } catch (error) {
      console.error('Error extracting message:', error);
    }
  });

  return messages;
}

// Extract conversation partner info
function extractConversationPartner() {
  const partnerSelectors = [
    '.msg-thread__link-to-profile',
    '.msg-overlay-bubble-header__title a',
    '.msg-thread__topic-name'
  ];
  const avatarSelectors = [
    '.msg-thread__link-to-profile img',
    '.msg-overlay-bubble-header__title img',
    '.msg-thread__avatar img',
    '.msg-overlay-bubble-header__avatar img'
  ];

  const getAvatarUrl = () => {
    for (const selector of avatarSelectors) {
      const imgEl = document.querySelector(selector);
      if (imgEl) {
        return imgEl.getAttribute('src') || imgEl.getAttribute('data-delayed-url');
      }
    }
    return null;
  };

  for (const selector of partnerSelectors) {
    const partnerEl = document.querySelector(selector);
    if (partnerEl) {
      return {
        name: partnerEl.textContent.trim(),
        url: partnerEl.href || window.location.href,
        avatar: getAvatarUrl(),
      };
    }
  }

  return {
    name: 'Unknown',
    url: window.location.href,
    avatar: getAvatarUrl(),
  };
}

async function scanMessages({ source = 'manual', messages, partner, threadKey, hash } = {}) {
  if (autoScanInFlight) return;
  autoScanInFlight = true;

  const isManual = source === 'manual';

  if (isManual) {
    setScanButtonState(true, 'Scanning...');
    updateStatus('Extracting messages...');
  } else {
    updateStatus('🤖 Auto-scanning...', 0);
  }

  try {
    const resolvedMessages = messages || extractMessages();
    if (resolvedMessages.length === 0) {
      if (isManual) {
        updateStatus('No messages found', 3000);
        setScanButtonState(false, 'Scan Messages for Tasks');
      }
      return;
    }

    const resolvedPartner = partner || extractConversationPartner();
    const resolvedThreadKey = threadKey || resolvedPartner.url || window.location.href;
    const resolvedHash = hash || computeHash(
      resolvedMessages.map((msg) => `${msg.sender}|${msg.text}`).join('|')
    );

    if (isManual) {
      updateStatus(`Found ${resolvedMessages.length} messages`);
      setTimeout(() => {
        updateStatus('🤖 AI analyzing...');
      }, 500);
    }

    chrome.runtime.sendMessage({
      type: 'SCAN_LINKEDIN_MESSAGES',
      data: {
        messages: resolvedMessages,
        partner: resolvedPartner,
      },
    }, (response) => {
      if (response && response.success) {
        if (response.tasksCreated > 0) {
          updateStatus(`✨ ${isManual ? 'Created' : 'Auto-created'} ${response.tasksCreated} AI tasks!`, 4000);
        } else {
          updateStatus('✓ No action items found', 4000);
        }
      } else {
        updateStatus(`✗ ${response?.error || 'Error scanning messages'}`, 4000);
      }

      const state = loadAutoScanState();
      state[resolvedThreadKey] = {
        hash: resolvedHash,
        lastScanAt: Date.now(),
      };
      saveAutoScanState(state);

      if (isManual) {
        setScanButtonState(false, 'Scan Messages for Tasks');
      }
      autoScanInFlight = false;
    });
  } catch (error) {
    console.error('Error scanning messages:', error);
    updateStatus('✗ Error scanning messages', 4000);
    if (isManual) {
      setScanButtonState(false, 'Scan Messages for Tasks');
    }
    autoScanInFlight = false;
  }
}

function autoScanIfNeeded() {
  if (!isAutoScanEnabled() || autoScanInFlight || !isMessagingPage()) return;

  const messages = extractMessages();
  if (messages.length < AUTO_SCAN_MIN_MESSAGES) return;

  const partner = extractConversationPartner();
  const threadKey = partner.url || window.location.href;
  const hash = computeHash(messages.map((msg) => `${msg.sender}|${msg.text}`).join('|'));

  const state = loadAutoScanState();
  const lastState = state[threadKey];
  const recentlyScanned = lastState && (Date.now() - lastState.lastScanAt < AUTO_SCAN_COOLDOWN_MS);
  if (lastState && lastState.hash === hash && recentlyScanned) return;

  scanMessages({ source: 'auto', messages, partner, threadKey, hash });
}

function startAutoScan() {
  if (autoScanIntervalId) return;
  autoScanIntervalId = setInterval(autoScanIfNeeded, AUTO_SCAN_INTERVAL_MS);
  setTimeout(autoScanIfNeeded, 3000);
}

// Create the message scanner UI
function createMessageScannerUI() {
  // Check if already exists
  if (document.getElementById('linkedin-message-scanner')) {
    return;
  }

  const scannerContainer = document.createElement('div');
  scannerContainer.id = 'linkedin-message-scanner';
  scannerContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    min-width: 200px;
  `;

  scannerContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <div style="font-size: 14px; font-weight: 600;">AI Task Scanner</div>
    </div>
    <div style="font-size: 11px; opacity: 0.8; margin-bottom: 12px; text-align: center;">
      Powered by VertexAI
    </div>
    <button id="scan-messages-btn" style="
      width: 100%;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
       onmouseout="this.style.background='rgba(255,255,255,0.2)'">
      Scan Messages for Tasks
    </button>
    <div id="scan-status" style="margin-top: 8px; font-size: 12px; text-align: center; opacity: 0.9;"></div>
    <div id="auto-scan-toggle" style="margin-top: 6px; font-size: 11px; text-align: center; opacity: 0.8; cursor: pointer;"></div>
  `;

  document.body.appendChild(scannerContainer);

  // Add event listener
  const scanBtn = document.getElementById('scan-messages-btn');
  const statusEl = document.getElementById('scan-status');
  const autoScanToggle = document.getElementById('auto-scan-toggle');
  scanBtnRef = scanBtn;
  statusElRef = statusEl;
  autoScanToggleRef = autoScanToggle;
  updateAutoScanToggle();

  scanBtn.addEventListener('click', () => scanMessages({ source: 'manual' }));
  autoScanToggle.addEventListener('click', () => {
    setAutoScanEnabled(!isAutoScanEnabled());
  });
}

// Initialize on messaging page
if (isMessagingPage()) {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createMessageScannerUI);
  } else {
    createMessageScannerUI();
  }
  startAutoScan();

  // Re-inject on navigation (LinkedIn is SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (isMessagingPage()) {
        setTimeout(createMessageScannerUI, 1000);
        startAutoScan();
      } else {
        const scanner = document.getElementById('linkedin-message-scanner');
        if (scanner) scanner.remove();
      }
    }
  }).observe(document, { subtree: true, childList: true });
}


