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

  if (request.type === 'SCAN_LINKEDIN_MESSAGES') {
    scanLinkedInMessages(request.data)
      .then(result => sendResponse({ success: true, tasksCreated: result.tasksCreated }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.type === 'PROCESS_MEETING_TRANSCRIPT') {
    processMeetingTranscript(request.payload)
      .then(result => sendResponse({ success: true, tasksCreated: result.tasksCreated }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Process Meeting Transcript (Google Meet or Zoom)
async function processMeetingTranscript(payload) {
  const { meetingTitle, transcript, speakers, timestamp, sourceType } = payload;
  const type = sourceType || 'google_meet'; // Default to meet if not specified

  console.log(`[Comedia Agent] Processing ${type} transcript via Edge Function:`, transcript.length, 'chars');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        content: transcript,
        source: {
          type: type,
          metadata: {
            subject: meetingTitle,
            date: timestamp,
            participants: speakers,
            url: type === 'google_meet' ? 'https://meet.google.com' : 'https://zoom.us'
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Edge Function failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Comedia Agent] AI Extraction result:', data);

    const tasks = data.tasks || [];
    const createdTasks = [];

    // Create tasks in DB
    for (const extractedTask of tasks) {
      const task = {
        title: extractedTask.title,
        description: extractedTask.description,
        status: 'incoming',
        priority: extractedTask.priority,
        source: 'meet',
        confidence_score: extractedTask.confidence,
        source_reference: {
          original_url: 'https://meet.google.com',
          snippet: transcript.substring(0, 200)
        },
        due_date: extractedTask.dueDate || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        await createTask(task); // Re-use existing create function
        createdTasks.push(task);
      } catch (err) {
        console.error('Failed to save task:', err);
      }
    }

    if (createdTasks.length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.svg',
        title: 'Meeting Agent',
        message: `Extracted ${createdTasks.length} tasks from your meeting!`,
        priority: 2
      });
    }

    return { tasksCreated: createdTasks.length };

  } catch (error) {
    console.error('Error processing meeting:', error);
    throw error;
  }
}

// Create task in Supabase
async function createTask(taskData) {
  const task = {
    id: generateUUID(),
    title: taskData.title,
    description: taskData.description || '',
    status: taskData.status || 'incoming',
    priority: taskData.priority || 'medium',
    source: taskData.source || 'manual',
    labels: taskData.labels || [],
    tags: taskData.tags || [],
    contact: taskData.contact || null,
    due_date: taskData.due_date || null,
    completed_date: null,
    recurrence_enabled: true,
    recurrence_days: 7,
    confidence_score: taskData.confidence_score || null,
    source_reference: taskData.source_reference || null,
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Scan LinkedIn messages for tasks using AI
async function scanLinkedInMessages(data) {
  const { messages, partner } = data;

  console.log('[Comedia Agent] Scanning', messages.length, 'LinkedIn messages via AI...');

  // Combine all messages into a conversation string
  const conversationText = messages
    .map(msg => `${msg.sender}: ${msg.text}`)
    .join('\n\n');

  console.log('[Comedia Agent] Processing LinkedIn conversation via Edge Function:', conversationText.length, 'chars');

  try {
    // Call VertexAI Edge Function for AI extraction
    const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        content: conversationText,
        source: {
          type: 'linkedin',
          metadata: {
            from: partner.name,
            date: new Date().toISOString(),
            participants: [partner.name],
            url: partner.url
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function failed: ${response.status} - ${errorText}`);
    }

    const aiResult = await response.json();
    console.log('[Comedia Agent] AI Extraction result:', aiResult);

    const tasks = aiResult.tasks || [];
    const createdTasks = [];

    // Create tasks in DB
    for (const extractedTask of tasks) {
      const task = {
        title: extractedTask.title,
        description: extractedTask.description,
        status: 'incoming',
        priority: extractedTask.priority || 'medium',
        source: 'linkedin',
        confidence_score: extractedTask.confidence,
        labels: ['linkedin', 'message'],
        contact: {
          name: partner.name,
          email: null,
          role: null,
          company: null,
          avatar: null,
          linkedin_url: partner.url,
        },
        source_reference: {
          original_url: partner.url,
          snippet: conversationText.substring(0, 200),
        },
        due_date: extractedTask.dueDate || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        await createTask(task);
        createdTasks.push(task);
      } catch (err) {
        console.error('[Comedia Agent] Failed to save task:', err);
      }
    }

    if (createdTasks.length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.svg',
        title: 'LinkedIn Agent',
        message: `Extracted ${createdTasks.length} tasks from your conversation!`,
        priority: 2
      });
    }

    console.log('[Comedia Agent] Created', createdTasks.length, 'tasks from AI extraction');
    return { tasksCreated: createdTasks.length };

  } catch (error) {
    console.error('[Comedia Agent] Error processing LinkedIn messages:', error);
    throw error;
  }
}

// Listen for extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[LinkedIn Task Creator] Extension installed');
    // Open options page or welcome page
    chrome.tabs.create({ url: 'popup.html' });
  }
});

