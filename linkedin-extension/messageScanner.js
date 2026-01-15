// LinkedIn Message Scanner
// Scans LinkedIn messages and extracts tasks using AI

// Check if we're on the messaging page
function isMessagingPage() {
  return window.location.pathname.includes('/messaging/');
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

  for (const selector of partnerSelectors) {
    const partnerEl = document.querySelector(selector);
    if (partnerEl) {
      return {
        name: partnerEl.textContent.trim(),
        url: partnerEl.href || window.location.href,
      };
    }
  }

  return {
    name: 'Unknown',
    url: window.location.href,
  };
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
  `;

  document.body.appendChild(scannerContainer);

  // Add event listener
  const scanBtn = document.getElementById('scan-messages-btn');
  const statusEl = document.getElementById('scan-status');

  scanBtn.addEventListener('click', async () => {
    scanBtn.disabled = true;
    scanBtn.textContent = 'Scanning...';
    statusEl.textContent = 'Extracting messages...';

    try {
      // Extract messages
      const messages = extractMessages();
      
      if (messages.length === 0) {
        statusEl.textContent = 'No messages found';
        scanBtn.textContent = 'Scan Messages for Tasks';
        scanBtn.disabled = false;
        return;
      }

      statusEl.textContent = `Found ${messages.length} messages`;

      // Get conversation partner
      const partner = extractConversationPartner();

      // Update status for AI processing
      setTimeout(() => {
        statusEl.textContent = '🤖 AI analyzing...';
      }, 500);

      // Send to background script for AI processing
      chrome.runtime.sendMessage({
        type: 'SCAN_LINKEDIN_MESSAGES',
        data: {
          messages,
          partner,
        },
      }, (response) => {
        if (response && response.success) {
          if (response.tasksCreated > 0) {
            statusEl.textContent = `✨ Created ${response.tasksCreated} AI tasks!`;
          } else {
            statusEl.textContent = '✓ No action items found';
          }
          setTimeout(() => {
            statusEl.textContent = '';
          }, 4000);
        } else {
          statusEl.textContent = `✗ ${response?.error || 'Error scanning messages'}`;
          setTimeout(() => {
            statusEl.textContent = '';
          }, 4000);
        }
        scanBtn.textContent = 'Scan Messages for Tasks';
        scanBtn.disabled = false;
      });

    } catch (error) {
      console.error('Error scanning messages:', error);
      statusEl.textContent = '✗ Error scanning messages';
      scanBtn.textContent = 'Scan Messages for Tasks';
      scanBtn.disabled = false;
    }
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

  // Re-inject on navigation (LinkedIn is SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (isMessagingPage()) {
        setTimeout(createMessageScannerUI, 1000);
      } else {
        const scanner = document.getElementById('linkedin-message-scanner');
        if (scanner) scanner.remove();
      }
    }
  }).observe(document, { subtree: true, childList: true });
}


