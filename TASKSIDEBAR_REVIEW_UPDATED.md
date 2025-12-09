# TaskSidebar Component Review - Business CRM Context

## Understanding the App Context

This is **NOT** a simple personal task manager. Based on the PRD, this is:
- **AI-native Lead Management CRM**
- Business-focused application for managing leads, contacts, accounts, and deals
- Will integrate with Google Workspace (Gmail, Calendar, Meet) and LinkedIn
- Features lead scoring, rating, and AI-powered lead capture

## Current TaskSidebar Implementation - Business Context

The TaskSidebar is actually **well-designed for a CRM use case**. Here's what should be there:

### ✅ Essential CRM Features (Currently Implemented)

1. **Title & Description** - Core task/lead information
2. **Priority** - Critical for lead prioritization
3. **Client/Company** - Essential for CRM (tracking which company)
4. **Deal ID** - Links tasks to deals in pipeline
5. **Contact Information** - Name, email, role, company (core CRM data)
6. **Account Information** - Contract value, expiry, relationship duration (sales context)
7. **Source Context** - Where the lead came from (Gmail, Meet, LinkedIn, etc.)
8. **Labels & Tags** - Organization and categorization
9. **Next Actions** - Follow-up items for sales process
10. **Recent Activity** - Timeline of interactions (critical for CRM)
11. **AI Captured Banner** - Shows confidence score for AI-detected leads
12. **Recurrence Settings** - For recurring follow-ups

### 🐛 Issues to Fix

1. **Due Date Not Editable** - Should be editable with date picker
2. **Recurrence Settings Not Visible** - Should show in view mode, not just edit mode
3. **Activity Tab Not Functional** - Tabs exist but Activity content never renders
4. **Next Actions & Recent Activity** - Display-only, should be editable/addable
5. **Lead Score Missing** - PRD mentions lead scoring, but not visible in sidebar
6. **Status/Stage Missing** - Should show current pipeline stage/column

### ➕ Missing Features (Based on PRD)

1. **Lead Score Display & Editing**
   - Show current lead score
   - Allow manual score adjustment
   - Show score rationale (why this score)

2. **Activity Timeline Functionality**
   - Add new activities (calls, emails, meetings)
   - Edit existing activities
   - Link activities to contacts/accounts/deals
   - Show agent-generated activities with badges

3. **Google Workspace Integration**
   - Link to Gmail thread
   - Link to Calendar event
   - Link to Meet recording
   - Initiate communication (Gmail compose, Calendar create)

4. **LinkedIn Integration** (Future)
   - Link to LinkedIn profile
   - Show LinkedIn data if available

5. **Deal/Lead Association**
   - Link task to specific deal
   - Show deal value
   - Show pipeline stage

6. **Attachments**
   - View attachments
   - Link to Drive folder (as mentioned in PRD)

## Recommended TaskSidebar Structure

### View Mode Should Show:

**Header:**
- Title (editable inline)
- Edit button
- Close button

**Core Information:**
- Description
- Priority badge
- Status/Stage (current column)
- Due date (editable)
- Lead score (if applicable) with rationale

**Business Context:**
- Client/Company name
- Deal ID (if linked to deal)
- Contact information (name, email, role, company, avatar)
- Account information (contract value, expiry, relationship)

**Source & AI:**
- Source (Gmail, Calendar, Meet, LinkedIn, Manual)
- AI Captured banner (if AI-generated) with confidence score
- Source context snippet
- Link to original source

**Organization:**
- Labels (badges)
- Tags (badges)
- Categories

**Recurrence:**
- Recurrence enabled/disabled
- Recurrence days
- Last completed date

**Activity Timeline:**
- Recent activities (chronological)
- Add new activity button
- Filter by type (call, email, meeting, note)

**Next Actions:**
- List of follow-up actions
- Add/edit actions
- Mark complete

**Metadata:**
- Created date
- Updated date
- Created by / Updated by

**Actions:**
- Delete task
- Move to different stage

### Edit Mode Should Allow:

- Title
- Description
- Priority
- Due date (date picker)
- Client/Company
- Deal ID
- Contact name, email, role, company
- Account information
- Labels (comma-separated)
- Tags
- Recurrence enabled/disabled
- Recurrence days
- Lead score (manual override)
- Status/Stage (move to different column)

## Priority Fixes

### High Priority (P0)
1. ✅ Fix Activity tab to actually show content
2. ✅ Add due date editing (date picker)
3. ✅ Show recurrence settings in view mode
4. ✅ Add lead score display (if task has score)
5. ✅ Show current status/stage

### Medium Priority (P1)
6. ✅ Make Next Actions editable/addable
7. ✅ Make Recent Activity editable/addable
8. ✅ Add Google Workspace links (Gmail, Calendar, Meet)
9. ✅ Show deal association if linked

### Low Priority (P2)
10. ✅ LinkedIn integration
11. ✅ Attachment viewing
12. ✅ Activity filtering

## Conclusion

The TaskSidebar is **correctly designed for a CRM** - all those "CRM fields" are actually needed! The main issues are:
- Some features are display-only when they should be editable
- Missing some key CRM features (lead score, activity management)
- Activity tab not functional

The structure is good - it just needs to be fully functional for the business use case.

