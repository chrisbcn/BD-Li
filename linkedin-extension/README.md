# LinkedIn Task Creator - Chrome Extension

Create tasks from LinkedIn profiles with one click. Never forget to follow up with important connections.

## Features

- **One-Click Task Creation** - Add a "Create Task" button to every LinkedIn profile
- **Smart Templates** - Pre-built templates for common scenarios:
  - Reconnect with someone
  - Follow up on a conversation
  - Congratulate on new role
  - Schedule a meeting
  - Custom task
- **Auto-Extract Profile Data** - Automatically captures name, title, company, profile picture, and LinkedIn URL
- **Direct Integration** - Tasks are saved directly to your Supabase database
- **Editable Before Saving** - Customize any template before creating the task

## Installation

### Step 1: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `linkedin-extension` folder from your Task Management App directory
5. The extension should now appear in your extensions list

### Step 2: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "LinkedIn Task Creator" and click the pin icon
3. The extension icon will appear in your toolbar

### Step 3: Make Sure Your Task App is Running

The extension saves tasks directly to Supabase, so no local server is required. However, you can verify tasks are being created by opening your Task Management App:

```bash
cd "Task Management App"
npm run dev
```

## Usage

1. **Visit a LinkedIn Profile**
   - Navigate to any LinkedIn profile page (e.g., `https://www.linkedin.com/in/username`)

2. **Click "Create Task" Button**
   - You'll see a blue "Create Task" button near the "Connect" and "Message" buttons
   - Click it to open the task creation modal

3. **Choose a Template**
   - Select from pre-built templates or create a custom task
   - Templates automatically fill in the person's name, company, etc.

4. **Customize & Create**
   - Edit the title and description as needed
   - Set priority (Low/Medium/High)
   - Click "Create Task"

5. **View in Your Task App**
   - The task appears in the "Incoming" column
   - Contains the contact's LinkedIn info and profile picture
   - Tagged with "linkedin" label

## Templates Explained

### 1. Reconnect
"Reconnect with {name}"
- Perfect for people you haven't talked to in a while
- Suggests catching up and seeing how things are going

### 2. Follow Up
"Follow up with {name}"
- For continuing a previous conversation
- Keeps your pipeline moving

### 3. Congratulate
"Congratulate {name} on new role"
- Great for when someone changes jobs
- LinkedIn will show recent job changes

### 4. Schedule Meeting
"Schedule meeting with {name}"
- Direct request to set up a call or meeting
- Good for active prospects

### 5. Custom Task
"Task for {name}"
- Blank slate for any other scenario
- Full control over title and description

## Troubleshooting

### Button Doesn't Appear
- **Refresh the page** - LinkedIn is a single-page app, sometimes needs a refresh
- **Check you're on a profile** - Button only shows on profile pages (`/in/username`)
- **Verify extension is enabled** - Go to `chrome://extensions/` and make sure it's active

### Task Doesn't Save
- **Check Supabase credentials** - Open `background.js` and verify your project URL and anon key
- **Check console** - Right-click extension icon → Inspect popup → Check console for errors
- **Verify database permissions** - Make sure RLS policies allow inserts on the `tasks` table

### Profile Data Not Extracted
- LinkedIn frequently changes their HTML structure
- Check browser console for extraction errors
- You can still create the task manually by filling in the fields

## Development

### File Structure
```
linkedin-extension/
├── manifest.json         # Extension configuration
├── content.js           # Runs on LinkedIn pages, injects button
├── background.js        # Handles API calls to Supabase
├── styles.css           # Styling for button and modal
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic
├── icons/               # Extension icons
└── README.md           # This file
```

### Customizing Templates

Edit the `templates` array in `content.js`:

```javascript
const templates = [
  {
    id: 'your_template',
    name: 'Your Template Name',
    title: 'Template title with {name} placeholder',
    description: 'Description with {name}, {company}, {headline} placeholders'
  }
];
```

Available placeholders:
- `{name}` - Person's name
- `{company}` - Current company
- `{headline}` - LinkedIn headline/title

### Updating Supabase Credentials

If you need to change your Supabase project:

1. Open `background.js`
2. Update `SUPABASE_URL` with your project URL
3. Update `SUPABASE_ANON_KEY` with your anon/public key
4. Reload the extension in `chrome://extensions/`

## Privacy & Permissions

This extension requires:
- **Access to linkedin.com** - To inject the button and extract profile data
- **Access to localhost:5173** - To communicate with your local Task Management App (optional)
- **Storage** - To save extension settings (future feature)

**No data is sent to any third-party servers.** All data goes directly from LinkedIn → Your Supabase database.

## Roadmap

- [ ] Bulk task creation from LinkedIn search results
- [ ] Automatic follow-up reminders based on last contact date
- [ ] Integration with LinkedIn messages
- [ ] Task templates based on relationship stage
- [ ] Chrome sync for settings across devices
- [ ] Contact deduplication

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify your Supabase credentials
3. Make sure you're on a LinkedIn profile page
4. Try reloading the extension

## License

Part of the Task Management App project.

