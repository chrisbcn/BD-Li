// LinkedIn Task Creator - Content Script
// Runs on LinkedIn profile pages and injects a "Create Task" button

let taskButton = null;
let taskModal = null;

// Check if we're on a profile page
function isProfilePage() {
  return window.location.pathname.includes('/in/') || 
         window.location.pathname.match(/^\/in\/[^\/]+\/?$/);
}

// Extract profile data from the LinkedIn page
function extractProfileData() {
  const data = {
    url: window.location.href,
    name: '',
    headline: '',
    company: '',
    location: '',
    profileImage: '',
    about: ''
  };

  // Extract name - try multiple selectors
  const nameSelectors = [
    'h1.text-heading-xlarge',
    'h1[class*="top-card-layout__title"]',
    '.pv-top-card--list li:first-child',
    '.ph5.pb5 h1'
  ];
  
  for (const selector of nameSelectors) {
    const nameEl = document.querySelector(selector);
    if (nameEl && nameEl.textContent.trim()) {
      data.name = nameEl.textContent.trim();
      break;
    }
  }

  // Extract headline/title
  const headlineSelectors = [
    'div.text-body-medium',
    '[class*="top-card-layout__headline"]',
    '.pv-top-card--list-bullet li'
  ];
  
  for (const selector of headlineSelectors) {
    const headlineEl = document.querySelector(selector);
    if (headlineEl && headlineEl.textContent.trim()) {
      data.headline = headlineEl.textContent.trim();
      break;
    }
  }

  // Extract current company - look for experience section
  const companySelectors = [
    '.pv-text-details__right-panel .hoverable-link-text',
    '[class*="experience"] [class*="mr1 t-bold"] span[aria-hidden="true"]',
    '.experience-item__subtitle'
  ];
  
  for (const selector of companySelectors) {
    const companyEl = document.querySelector(selector);
    if (companyEl && companyEl.textContent.trim()) {
      data.company = companyEl.textContent.trim();
      break;
    }
  }

  // Extract location
  const locationSelectors = [
    'span.text-body-small.inline.t-black--light.break-words',
    '[class*="top-card__subline-item"]'
  ];
  
  for (const selector of locationSelectors) {
    const locationEl = document.querySelector(selector);
    if (locationEl && locationEl.textContent.includes(',')) {
      data.location = locationEl.textContent.trim();
      break;
    }
  }

  // Extract profile image
  const imgSelectors = [
    'img.pv-top-card-profile-picture__image',
    'button[aria-label*="profile picture"] img',
    'img[class*="profile-photo"]'
  ];
  
  for (const selector of imgSelectors) {
    const imgEl = document.querySelector(selector);
    if (imgEl && imgEl.src) {
      data.profileImage = imgEl.src;
      break;
    }
  }

  // Extract about section
  const aboutEl = document.querySelector('[class*="about"] [class*="full-width"] span[aria-hidden="true"]');
  if (aboutEl) {
    data.about = aboutEl.textContent.trim().substring(0, 500); // Limit length
  }

  return data;
}

// Create a floating button as fallback
function createFloatingButton() {
  if (taskButton && taskButton.isConnected) {
    console.log('[LinkedIn Task Creator] Floating button already exists');
    return;
  }

  console.log('[LinkedIn Task Creator] Creating new floating button');
  taskButton = document.createElement('button');
  taskButton.className = 'linkedin-task-creator-btn linkedin-task-creator-floating';
  
  // FORCE floating position with inline styles (overrides everything!)
  taskButton.style.cssText = `
    position: fixed !important;
    bottom: 30px !important;
    left: 30px !important;
    z-index: 999999 !important;
    background: #003B8F !important;
    color: #FAAFB6 !important;
    border: none !important;
    border-radius: 24px !important;
    padding: 12px 20px !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    box-shadow: 0 4px 12px rgba(241, 227, 26, 0.3) !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    font-family: -apple-system, system-ui, sans-serif !important;
    width: 150px !important;
  `;
  
  taskButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAAFB6" stroke-width="2">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
    </svg>
    <span>Create Task</span>
  `;
  
  taskButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showTaskModal();
  });

  document.body.appendChild(taskButton);
  console.log('[LinkedIn Task Creator] Floating button created and styled');
  console.log('[LinkedIn Task Creator] Button position:', taskButton.style.position, taskButton.style.bottom, taskButton.style.right);
}

// Create and inject the task button
function injectTaskButton() {
  if (taskButton && taskButton.isConnected) return; // Already injected and in DOM

  console.log('[LinkedIn Task Creator] Looking for Message button...');
  
  // SUPER SIMPLE: Find ANY button with "Message" text on the entire page
  const allButtons = Array.from(document.querySelectorAll('button'));
  const messageButton = allButtons.find(btn => {
    const text = btn.textContent.trim();
    const ariaLabel = btn.getAttribute('aria-label') || '';
    return text === 'Message' || ariaLabel.includes('Message');
  });
  
  if (!messageButton) {
    console.log('[LinkedIn Task Creator] No Message button found, using floating button');
    createFloatingButton();
    return;
  }
  
  console.log('[LinkedIn Task Creator] Found Message button, inserting task button after it');
  
  // Create the button
  taskButton = document.createElement('button');
  taskButton.className = 'linkedin-task-creator-btn';
  taskButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
    </svg>
    <span>Create Task</span>
  `;
  
  taskButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[LinkedIn Task Creator] Button clicked!');
    showTaskModal();
  });
  
  // Insert right after the Message button
  messageButton.insertAdjacentElement('afterend', taskButton);
  console.log('[LinkedIn Task Creator] ✅ Button inserted successfully!');
}

// OLD CODE BELOW - DISABLED
function injectTaskButtonOld() {
  // Strategy: Find the MAIN profile section, skip anything sticky/fixed
  // The main profile card is in a <main> tag, sticky header is not
  const mainTag = document.querySelector('main');
  if (!mainTag) {
    console.log('[LinkedIn Task Creator] No <main> tag found');
    createFloatingButton();
    return;
  }

  console.log('[LinkedIn Task Creator] Found <main> tag, looking for profile section inside it');

  // Find all potential button containers, but ONLY within <main>
  const allContainers = mainTag.querySelectorAll('div[class*="pv-top-card"]');
  console.log('[LinkedIn Task Creator] Found', allContainers.length, 'containers in <main>');
  
  let actionsContainer = null;
  
  // Find the first container that has action buttons and is NOT sticky
  for (const container of allContainers) {
    // Check all parent elements for sticky/fixed positioning
    let element = container;
    let isSticky = false;
    
    while (element && element !== mainTag) {
      const style = window.getComputedStyle(element);
      if (style.position === 'fixed' || style.position === 'sticky') {
        isSticky = true;
        break;
      }
      element = element.parentElement;
    }
    
    const hasButtons = container.querySelector('button');
    
    console.log('[LinkedIn Task Creator] Checking container:', {
      className: container.className.substring(0, 50),
      isSticky,
      hasButtons: !!hasButtons
    });
    
    if (!isSticky && hasButtons) {
      actionsContainer = container;
      console.log('[LinkedIn Task Creator] ✅ Selected non-sticky container with buttons');
      break;
    }
  }
  
  // Fallback: look for specific action button patterns
  if (!actionsContainer) {
    const fallbackSelectors = [
      'div.pv-top-card-v2-ctas',
      'div.pv-top-card-v3-ctas',
      'div.pvs-profile-actions',
      'div:has(> button[aria-label*="Message"])'
    ];
    
    for (const selector of fallbackSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          if (style.position !== 'fixed' && style.position !== 'sticky') {
            actionsContainer = el;
            console.log('[LinkedIn Task Creator] Found via fallback selector:', selector);
            break;
          }
        }
        if (actionsContainer) break;
      } catch (e) {
        console.log('[LinkedIn Task Creator] Selector failed:', selector, e);
      }
    }
  }
  
  if (!actionsContainer) {
    console.log('[LinkedIn Task Creator] No suitable container found (attempt ' + injectionAttempts + '/' + MAX_ATTEMPTS + ')');
    
    if (injectionAttempts < MAX_ATTEMPTS) {
      setTimeout(attemptInjection, 1500);
    } else {
      console.log('[LinkedIn Task Creator] Max retries, using floating button...');
      createFloatingButton();
    }
    return;
  }

  console.log('[LinkedIn Task Creator] Selected container:', {
    className: actionsContainer.className,
    buttonCount: actionsContainer.querySelectorAll('button').length
  });

  // Create the button
  taskButton = document.createElement('button');
  taskButton.className = 'linkedin-task-creator-btn';
  taskButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
    </svg>
    <span>Create Task</span>
  `;
  
  taskButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[LinkedIn Task Creator] Button clicked!');
    showTaskModal();
  });

  // Make sure we're not injecting into a fixed/sticky element
  const computedStyle = window.getComputedStyle(actionsContainer);
  if (computedStyle.position === 'fixed' || computedStyle.position === 'sticky') {
    console.log('[LinkedIn Task Creator] Skipping fixed/sticky container, looking for main profile...');
    if (injectionAttempts < MAX_ATTEMPTS) {
      setTimeout(attemptInjection, 1500);
    } else {
      createFloatingButton();
    }
    return;
  }

  // Find all buttons in the container
  const allButtons = Array.from(actionsContainer.querySelectorAll('button'));
  console.log('[LinkedIn Task Creator] Found', allButtons.length, 'buttons');
  console.log('[LinkedIn Task Creator] Button texts:', allButtons.map(b => b.textContent.trim().substring(0, 20)));
  
  if (allButtons.length === 0) {
    console.log('[LinkedIn Task Creator] No buttons found, using floating button');
    createFloatingButton();
    return;
  }

  // Find the actual action buttons by looking for Message/More buttons
  const actionButtons = allButtons.filter(btn => {
    const text = btn.textContent.trim();
    return text === 'Message' || text === 'More' || text.includes('Open in') || text === 'Follow' || text === 'Connect';
  });
  
  console.log('[LinkedIn Task Creator] Found', actionButtons.length, 'action buttons');
  
  if (actionButtons.length === 0) {
    console.log('[LinkedIn Task Creator] No action buttons found, using floating button');
    createFloatingButton();
    return;
  }

  // Get the last action button
  const lastActionButton = actionButtons[actionButtons.length - 1];
  
  // Find the parent container that holds these action buttons in a row
  let buttonRow = lastActionButton.parentElement;
  
  // Make sure we're in a flex row (action buttons are in a flex container)
  let attempts = 0;
  while (buttonRow && attempts < 5) {
    const style = window.getComputedStyle(buttonRow);
    const hasMultipleButtons = buttonRow.querySelectorAll('button').length >= 2;
    
    if ((style.display === 'flex' || style.display === 'inline-flex') && hasMultipleButtons) {
      console.log('[LinkedIn Task Creator] Found button row container');
      break;
    }
    
    buttonRow = buttonRow.parentElement;
    attempts++;
  }
  
  if (!buttonRow || buttonRow === actionsContainer) {
    // Just insert after the last action button
    lastActionButton.insertAdjacentElement('afterend', taskButton);
    console.log('[LinkedIn Task Creator] ✅ Inserted after last action button');
  } else {
    // Append to the button row container
    buttonRow.appendChild(taskButton);
    console.log('[LinkedIn Task Creator] ✅ Appended to button row container');
  }

  console.log('[LinkedIn Task Creator] Button injected successfully');
  console.log('[LinkedIn Task Creator] Button element:', taskButton);
  console.log('[LinkedIn Task Creator] Button visible?', taskButton.offsetWidth > 0 && taskButton.offsetHeight > 0);
  
  // If button is not visible, try floating button instead
  setTimeout(() => {
    if (taskButton && (taskButton.offsetWidth === 0 || taskButton.offsetHeight === 0)) {
      console.log('[LinkedIn Task Creator] Injected button not visible, switching to floating button');
      taskButton.remove();
      taskButton = null;
      createFloatingButton();
    }
  }, 500);
}

// Task templates
const templates = [
  {
    id: 'reconnect',
    name: 'Reconnect',
    title: 'Reconnect with {name}',
    description: 'Reach out to {name} to catch up and see how things are going at {company}.'
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    title: 'Follow up with {name}',
    description: 'Follow up with {name} regarding our previous conversation.'
  },
  {
    id: 'congratulate',
    name: 'Congratulate',
    title: 'Congratulate {name} on new role',
    description: 'Send a congratulations message to {name} on their new position at {company}.'
  },
  {
    id: 'meeting',
    name: 'Schedule Meeting',
    title: 'Schedule meeting with {name}',
    description: 'Reach out to {name} to schedule a meeting to discuss potential collaboration.'
  },
  {
    id: 'custom',
    name: 'Custom Task',
    title: 'Task for {name}',
    description: ''
  }
];

// Apply template and replace placeholders
function applyTemplate(template, profileData) {
  const replacePlaceholders = (text) => {
    return text
      .replace(/{name}/g, profileData.name || 'Contact')
      .replace(/{company}/g, profileData.company || 'their company')
      .replace(/{headline}/g, profileData.headline || 'their role');
  };

  return {
    title: replacePlaceholders(template.title),
    description: replacePlaceholders(template.description)
  };
}

// Show the task creation modal
function showTaskModal() {
  if (taskModal) {
    taskModal.style.display = 'flex';
    return;
  }

  const profileData = extractProfileData();
  console.log('[LinkedIn Task Creator] Extracted profile data:', profileData);

  // Create modal
  taskModal = document.createElement('div');
  taskModal.className = 'linkedin-task-modal';
  taskModal.innerHTML = `
    <div class="linkedin-task-modal-content">
      <div class="linkedin-task-modal-header">
        <h2>Create Task</h2>
        <button class="linkedin-task-modal-close">&times;</button>
      </div>
      
      <div class="linkedin-task-profile-info">
        ${profileData.profileImage ? `<img src="${profileData.profileImage}" alt="${profileData.name}" />` : '<div class="profile-placeholder"></div>'}
        <div>
          <div class="profile-name">${profileData.name || 'Unknown'}</div>
          <div class="profile-headline">${profileData.headline || ''}</div>
          ${profileData.company ? `<div class="profile-company">${profileData.company}</div>` : ''}
        </div>
      </div>

      <div class="linkedin-task-form">
        <div class="form-group">
          <label>Template</label>
          <select id="task-template">
            ${templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Task Title</label>
          <input type="text" id="task-title" placeholder="Enter task title" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea id="task-description" rows="4" placeholder="Enter task description"></textarea>
        </div>

        <div class="form-group">
          <label>Priority</label>
          <select id="task-priority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="form-actions">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-create">Create Task</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(taskModal);

  // Get form elements
  const templateSelect = taskModal.querySelector('#task-template');
  const titleInput = taskModal.querySelector('#task-title');
  const descriptionInput = taskModal.querySelector('#task-description');
  const prioritySelect = taskModal.querySelector('#task-priority');
  const closeBtn = taskModal.querySelector('.linkedin-task-modal-close');
  const cancelBtn = taskModal.querySelector('.btn-cancel');
  const createBtn = taskModal.querySelector('.btn-create');

  // Apply initial template
  const initialTemplate = applyTemplate(templates[0], profileData);
  titleInput.value = initialTemplate.title;
  descriptionInput.value = initialTemplate.description;

  // Template change handler
  templateSelect.addEventListener('change', (e) => {
    const template = templates.find(t => t.id === e.target.value);
    if (template) {
      const applied = applyTemplate(template, profileData);
      titleInput.value = applied.title;
      descriptionInput.value = applied.description;
    }
  });

  // Close handlers
  const closeModal = () => {
    taskModal.style.display = 'none';
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
  });

  // Create task handler
  createBtn.addEventListener('click', async () => {
    const taskData = {
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      priority: prioritySelect.value,
      status: 'incoming',
      source: 'manual',
      labels: ['linkedin'],
      contact: {
        name: profileData.name,
        email: '', // Not available from LinkedIn
        role: profileData.headline,
        company: profileData.company,
        avatar: profileData.profileImage,
        linkedin_url: profileData.url
      }
    };

    if (!taskData.title) {
      alert('Please enter a task title');
      return;
    }

    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    try {
      // Send to background script to create task
      chrome.runtime.sendMessage(
        { type: 'CREATE_TASK', payload: taskData },
        (response) => {
          if (response.success) {
            // Show success message
            createBtn.textContent = '✓ Created!';
            createBtn.style.backgroundColor = '#10b981';
            setTimeout(closeModal, 1000);
          } else {
            alert('Failed to create task: ' + (response.error || 'Unknown error'));
            createBtn.disabled = false;
            createBtn.textContent = 'Create Task';
          }
        }
      );
    } catch (error) {
      console.error('[LinkedIn Task Creator] Error:', error);
      alert('Failed to create task. Make sure the Task Management App is running.');
      createBtn.disabled = false;
      createBtn.textContent = 'Create Task';
    }
  });
}

// Initialize when on a profile page
let injectionAttempts = 0;
const MAX_ATTEMPTS = 3;

function init() {
  if (isProfilePage()) {
    console.log('[LinkedIn Task Creator] Profile page detected, injecting button...');
    attemptInjection();
  }
}

function attemptInjection() {
  injectionAttempts++;
  
  if (injectionAttempts <= MAX_ATTEMPTS) {
    injectTaskButton();
  } else {
    // After 3 attempts, just use floating button
    console.log('[LinkedIn Task Creator] Max attempts reached, using floating button');
    if (!taskButton) {
      createFloatingButton();
    }
  }
}

// Watch for navigation changes (LinkedIn is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    taskButton = null; // Reset button reference
    injectionAttempts = 0; // Reset attempt counter
    if (isProfilePage()) {
      setTimeout(attemptInjection, 500);
    }
  }
}).observe(document, { subtree: true, childList: true });

// Initial load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

