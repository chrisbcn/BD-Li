# Google Meet Integration - Setup Guide

This guide explains how to use the Google Meet transcript processing feature for AI-powered task extraction.

## Overview

The Google Meet integration allows you to:
- Upload meeting transcripts (manual)
- Extract action items and tasks automatically
- Link tasks to meeting participants
- Track meeting decisions and questions

**Note:** This is a **manual upload** feature for MVP. Automatic transcript fetching requires Google Workspace Enterprise/Education.

## How It Works

### Step 1: Get Your Meeting Transcript

There are several ways to get a Google Meet transcript:

#### Option A: Google Meet Automatic Transcription (Requires Google Workspace)

1. **Enable Recording** in your Google Meet settings
2. **Start Recording** during the meeting
3. After the meeting, find the recording in Google Drive
4. If transcription was enabled, the transcript file will be in the same folder
5. Open the transcript document
6. Copy all the text

#### Option B: Use Google Docs Voice Typing

1. Open a Google Doc during the meeting
2. Go to **Tools** → **Voice typing**
3. Click the microphone icon
4. Let it transcribe as the meeting happens
5. Copy the transcript after the meeting

#### Option C: Manual Meeting Notes

1. Take notes during the meeting in any format
2. Include:
   - Who said what (Speaker: Statement format works best)
   - Action items discussed
   - Decisions made
   - Questions raised
3. Copy your notes

#### Option D: Third-Party Tools

- **Otter.ai**: Joins meetings and creates transcripts
- **Fireflies.ai**: AI meeting assistant
- **Grain**: Automatic meeting recording and transcription
- **Tactiq**: Chrome extension for real-time transcription

### Step 2: Upload Transcript to Task Manager

1. Go to your Task Manager app
2. Click on **AI Agents** tab
3. Find the **Google Meet** card
4. Click **Upload Transcript** button
5. Fill in the form:
   - **Meeting Title**: Name of the meeting
   - **Participants**: Comma-separated names (optional, auto-detected)
   - **Transcript**: Paste or upload your transcript

### Step 3: Extract Tasks

1. Click **Extract Tasks from Transcript**
2. The AI will:
   - Parse the transcript
   - Identify speakers and participants
   - Extract action items and commitments
   - Create tasks in your "Incoming" column
3. Review extracted tasks and accept/edit/dismiss as needed

## Transcript Formats

### Format 1: Speaker-Statement (Recommended)

```
John Smith: We need to finalize the budget by Friday
Jane Doe: I'll send you the updated spreadsheet tomorrow
John Smith: Can you also reach out to the client for approval?
Jane Doe: Yes, I'll email them this afternoon
```

**Pros:**
- Clear speaker attribution
- Easy to parse
- Best for task linking to contacts

### Format 2: Plain Text Notes

```
Meeting Notes: Q4 Planning

- Need to finalize budget by Friday (John)
- Jane will send updated spreadsheet tomorrow
- Follow up with client for approval (Jane to email)
- Schedule follow-up meeting next week
```

**Pros:**
- Flexible format
- Works with any note-taking style
- Good for quick notes

### Format 3: Google Meet Export Format

```
[00:01:23] John Smith
We need to finalize the budget by Friday.

[00:02:15] Jane Doe
I'll send you the updated spreadsheet tomorrow.

[00:03:42] John Smith
Can you also reach out to the client for approval?
```

**Pros:**
- Official Google Meet format
- Includes timestamps
- Most accurate speaker attribution

### Format 4: Structured Meeting Minutes

```
MEETING: Q4 Planning
DATE: December 9, 2025
ATTENDEES: John Smith, Jane Doe, Alice Johnson

DISCUSSION:
- Budget finalization (John leading)
- Client approval needed (Jane to follow up)
- Spreadsheet updates required

ACTION ITEMS:
- John: Finalize budget by Friday
- Jane: Send updated spreadsheet tomorrow
- Jane: Email client for approval
```

**Pros:**
- Professional format
- Clear structure
- Easy to understand

## What Gets Extracted

### Action Items:
- Tasks with explicit action verbs ("will", "need to", "should")
- Assignments to specific people
- Deadlines and due dates
- Follow-up requests

### Decisions:
- Agreements made
- Choices finalized
- Consensus reached

### Questions:
- Open questions needing answers
- Concerns raised
- Clarifications needed

### Example Input:

```
Sarah: We need to launch the campaign by Monday. Can you prepare the assets?
Tom: Yes, I'll have them ready by Friday. Should we also update the landing page?
Sarah: Good idea. Let's do that. I'll coordinate with the design team.
Tom: I'll send you the draft for review tomorrow morning.
```

### Example Output (Tasks):

1. **Prepare campaign assets** (Tom, Due: Friday)
   - High priority
   - 85% confidence

2. **Review asset draft** (Sarah, Due: Tomorrow)
   - Medium priority
   - 80% confidence

3. **Update landing page** (Tom)
   - Medium priority
   - 75% confidence

4. **Coordinate with design team** (Sarah)
   - Medium priority
   - 70% confidence

## Tips for Best Results

### 1. Clear Speaker Attribution

**Good:**
```
Alice: I'll handle the client presentation
Bob: I'll prepare the slides
```

**Less Good:**
```
Someone will handle the client presentation
The slides need to be prepared
```

### 2. Specific Action Items

**Good:**
```
John: I'll email the report to the client by Friday
```

**Less Good:**
```
We should probably follow up at some point
```

### 3. Include Context

**Good:**
```
Sarah: For the Q4 launch, I'll finalize the budget by Friday and send it to accounting
```

**Less Good:**
```
Sarah: I'll do that by Friday
```

### 4. Mention Deadlines

**Good:**
```
Tom: I'll complete the review by end of day Wednesday
```

**Less Good:**
```
Tom: I'll try to finish soon
```

## Troubleshooting

### Transcript too short

**Error:** "Transcript appears to be invalid or too short"

**Solution:**
- Make sure transcript has at least 3 lines
- Include actual meeting content, not just metadata
- Check that you copied the full transcript

### No tasks extracted

**Issue:** AI finds no action items

**Solution:**
- Review the transcript for action words
- Add explicit action items: "I will...", "We need to..."
- Include speaker names for better attribution
- Try rephrasing vague statements to be more specific

### Wrong speaker attribution

**Issue:** Tasks assigned to wrong people

**Solution:**
- Use consistent name formatting
- Match names to contacts in your CRM
- Review and manually reassign tasks if needed
- Update contact names in the system

### Poor confidence scores

**Issue:** All tasks have low confidence (< 60%)

**Solution:**
- Use clearer language in transcripts
- Include explicit deadlines
- Mention specific action verbs
- Provide more context in the transcript

## Automatic Transcript Fetching (Future)

### Requirements:
- Google Workspace Enterprise or Education
- Admin permissions to enable Meet recording
- Google Drive API access

### How it would work:
1. Meetings are recorded automatically
2. Transcripts saved to Google Drive
3. App fetches transcripts via Google Drive API
4. Tasks extracted automatically after meeting
5. Notification sent with extracted tasks

**Status:** Planned for future release (Phase 4.1)

## Privacy & Security

### What We Store:
- Meeting title
- Participant names
- Extracted tasks (with snippets < 200 chars)
- Task creation timestamps

### What We DON'T Store:
- Full meeting transcripts
- Meeting recordings
- Complete conversation history
- Personal information beyond task context

### AI Processing:
- Transcripts processed via Gemini/Anthropic
- Your API keys are used (not shared)
- Processing happens on-demand
- No data retained by AI providers

## Integration with Contacts

### Automatic Contact Linking:

When a task mentions a participant:
1. System searches for matching contact by name
2. If found, task is linked to that contact
3. Activity record is created
4. Contact's "last contacted" date updates

### Creating Contacts from Meetings:

If participant not in CRM:
1. Review extracted tasks
2. Click on participant name
3. Choose "Create Contact"
4. Fill in additional details (email, company, etc.)
5. Task automatically links to new contact

## Best Practices

### 1. Consistent Meeting Titles

Use descriptive, consistent naming:
- "Q4 Planning - Week 1"
- "Client Check-in: Acme Corp"
- "Team Standup - Dec 9"

### 2. Regular Processing

Process transcripts soon after meetings:
- Tasks are fresh and relevant
- Context is clear
- Follow-up happens faster

### 3. Review and Refine

Always review AI-extracted tasks:
- Verify action items are correct
- Adjust priorities
- Add missing context
- Reassign if needed

### 4. Build a Library

Keep processed transcripts organized:
- Archive in Google Drive
- Tag by project/client
- Reference for future context

## Support

If you encounter issues:
1. Check transcript format matches examples
2. Verify AI configuration (Gemini or Anthropic)
3. Review browser console for errors
4. Check agent_runs table in Supabase for error logs

## Next Steps

After Google Meet is working:
1. Test with various transcript formats
2. Fine-tune AI prompts if needed
3. Set up regular transcript processing workflow
4. Consider upgrading to automatic fetching (requires Workspace)
5. All phases are now complete! 🎉


