# 🚀 LinkedIn Task Creator - Quick Start

Get up and running in 2 minutes!

## Step 1: Generate Icons (30 seconds)

1. Open `icons/generate-icons.html` in your browser
2. Click "Download All 3 Icons"
3. The 3 PNG files will download to your Downloads folder
4. Move them into the `linkedin-extension/icons/` folder

**Or skip this step** - Chrome will use default placeholder icons (extension still works perfectly)

## Step 2: Install Extension (30 seconds)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top-right)
4. Click **"Load unpacked"**
5. Select: `/Users/chrisbasey/Documents/Task Management App/linkedin-extension`
6. Done! ✓

## Step 3: Test It (1 minute)

1. Go to **any LinkedIn profile**: `https://www.linkedin.com/in/username`
2. Look for the blue **"Create Task"** button
3. Click it → Choose a template → Create task
4. Open your Task Management App to see the new task!

---

## What You Get

✅ **"Create Task" button** on every LinkedIn profile  
✅ **5 pre-built templates**:
- Reconnect with someone
- Follow up on conversation  
- Congratulate on new role
- Schedule a meeting
- Custom task

✅ **Auto-extracted data**:
- Name, title, company
- Profile picture
- LinkedIn URL

✅ **Direct integration** - Tasks save to your Supabase database instantly

---

## Common Issues

### Button doesn't show?
→ **Refresh the page** (LinkedIn is a single-page app)

### Task doesn't save?
→ Check `background.js` has correct Supabase credentials

### Console errors?
→ Right-click page → Inspect → Console tab to see what's wrong

---

## Next Steps

Now that you have the LinkedIn extension working, you can:

1. **Customize templates** - Edit `content.js` to add your own templates
2. **Build the Gmail agent** - Auto-extract tasks from emails (Phase 3)
3. **Add reconnection suggestions** - AI-powered relationship scoring (Phase 3)
4. **Slack integration** - Capture tasks from Slack DMs (Phase 4)

---

**Questions?** Check `README.md` or `INSTALLATION.md` for detailed docs.

