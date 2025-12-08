# LinkedIn Task Creator - Installation Guide

## Quick Start (5 minutes)

### Step 1: Create Extension Icons (Optional but Recommended)

1. Go to any icon generator website or use these simple placeholder icons:
   - Create 3 square images: 16x16, 48x48, and 128x128 pixels
   - Use a checkmark symbol with LinkedIn blue (#0a66c2)
   - Save as `icon16.png`, `icon48.png`, `icon128.png` in the `icons/` folder
   
   **Or skip this** - The extension will work with Chrome's default icon placeholder

### Step 2: Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Toggle **Developer mode** ON (top-right corner)
4. Click **"Load unpacked"** button
5. Navigate to and select: `/Users/chrisbasey/Documents/Task Management App/linkedin-extension`
6. Click **"Select"**
7. You should see "LinkedIn Task Creator" appear in your extensions list

### Step 3: Test It Out

1. Go to any LinkedIn profile (e.g., https://www.linkedin.com/in/williamhgates/)
2. Look for the blue **"Create Task"** button near "Connect" and "Message"
3. Click it and try creating a task
4. Open your Task Management App to see the new task in the "Incoming" column

## Troubleshooting

### "Create Task" Button Doesn't Appear

**Solution 1: Refresh the page**
- LinkedIn is a single-page app, so refresh the browser page after installing the extension

**Solution 2: Check you're on a profile page**
- The button only appears on profile pages with URLs like: `linkedin.com/in/username`
- It won't show on the feed, messaging, or jobs pages

**Solution 3: Check extension is active**
1. Go to `chrome://extensions/`
2. Find "LinkedIn Task Creator"
3. Make sure the toggle is ON (blue)
4. Click "Details" and verify it has permission to access linkedin.com

**Solution 4: Check the console**
1. Right-click anywhere on the LinkedIn page
2. Select "Inspect" → "Console" tab
3. Look for messages starting with `[LinkedIn Task Creator]`
4. Refresh the page and see if any errors appear

### Task Doesn't Save to Database

**Check browser console:**
1. Click the extension icon → Right-click → "Inspect popup"
2. Go to the "Console" tab
3. Try creating a task and watch for error messages

**Common issues:**
- Supabase credentials are incorrect in `background.js`
- Your Task Management App's Supabase project has Row Level Security blocking inserts
- Internet connection issue

**Fix:**
1. Open `linkedin-extension/background.js`
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` match your `.env` file values
3. Test by creating a task directly in your Task Management App to verify database is working

### Profile Data Isn't Extracted

LinkedIn frequently changes their HTML structure, so sometimes the data extraction breaks.

**Workaround:**
- You can still create tasks manually by typing in the fields
- The LinkedIn URL will always be captured correctly
- You can add the person's name/company manually

## Updating the Extension

After making any changes to the extension files:

1. Go to `chrome://extensions/`
2. Find "LinkedIn Task Creator"
3. Click the **refresh icon** (circular arrow)
4. Reload any open LinkedIn pages

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "LinkedIn Task Creator"
3. Click **"Remove"**
4. Confirm deletion

## Privacy Note

This extension:
- ✅ Only runs on linkedin.com
- ✅ Only sends data to YOUR Supabase database
- ✅ Does NOT send any data to third-party servers
- ✅ Does NOT track your browsing
- ✅ Source code is fully visible and editable

All profile data goes: LinkedIn → Your Computer → Your Supabase Database

