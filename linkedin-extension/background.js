// LinkedIn Task Creator - Background Service Worker
// Connects directly to Supabase database

const SUPABASE_URL = 'https://ibcinipuskqgwczuobyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2luaXB1c2txZ3djenVvYnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODc0MzgsImV4cCI6MjA3NDc2MzQzOH0.hgQmhdeCfrgOFYPIvI0t6gSTs4viLqKQzysutHDLuds';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CREATE_TASK') {
    createTask(request.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Create task in Supabase
async function createTask(taskData) {
  const task = {
    id: generateUUID(),
    title: taskData.title,
    description: taskData.description || '',
    status: taskData.status || 'incoming',
    priority: taskData.priority || 'medium',
    source: 'manual',
    labels: taskData.labels || ['linkedin'],
    tags: taskData.tags || [],
    contact: taskData.contact || null,
    due_date: taskData.due_date || null,
    completed_date: null,
    recurrence_enabled: true,
    recurrence_days: 7,
    confidence_score: null,
    source_reference: null,
    account_info: null,
    next_actions: null,
    recent_activity: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('[LinkedIn Task Creator] Creating task:', task);

  try {
    console.log('[LinkedIn Task Creator] Sending request to Supabase:', `${SUPABASE_URL}/rest/v1/tasks`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(task)
    });

    console.log('[LinkedIn Task Creator] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LinkedIn Task Creator] Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      throw new Error(errorData.message || errorData.hint || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('[LinkedIn Task Creator] Task created successfully:', result);

    // Show notification (optional, won't break if it fails)
    try {
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.svg',
          title: 'Task Created',
          message: `Task "${task.title}" has been added to your task list.`,
          priority: 2
        });
      }
    } catch (notifError) {
      console.log('[LinkedIn Task Creator] Could not show notification:', notifError);
    }

    return result;
  } catch (error) {
    console.error('[LinkedIn Task Creator] Error creating task:', error);
    throw error;
  }
}

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Listen for extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[LinkedIn Task Creator] Extension installed');
    // Open options page or welcome page
    chrome.tabs.create({ url: 'popup.html' });
  }
});

