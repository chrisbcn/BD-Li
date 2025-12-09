# TaskSidebar - Figma Design Analysis

## Overview
The Figma design shows a **Material Design**-inspired sidebar that's much **simpler and cleaner** than the current implementation. It uses a tabbed interface with two tabs: **"Details"** and **"Task"** (not "Activity").

## Design Structure

### Header
- **Tabs**: "Details" (active) and "Task" (inactive)
- **Close button**: X icon on the right
- Material Design styling with blue underline indicator

### View Mode ("Details" Tab)

**Main Details Section:**
- **Task Title**: Large, bold (20px, SemiBold)
- **Contact Information**:
  - Avatar (44x44px)
  - Name (bold, 16px)
  - Role/Company (12px, gray)
  - Relationship tag (e.g., "Hot" - red badge)
  - Last contact time with clock icon
- Horizontal divider

**Form Fields (Read-Only):**
1. **Task Title** - Text display
2. **Due Date** - Date display (e.g., "2025-09-12")
3. **Contact** - Name and company (e.g., "Dan Joseph | MiroTech")
4. **Lead Stage** - Stage value (e.g., "High")
5. **Engagement** - Engagement level (e.g., "High")
6. **Task Details** - Multi-line text (bullet points)

**Edit Button**: Blue text button to switch to edit mode

### Edit Mode

**Header:**
- Same tabs structure
- Title changes to "Add new task" or task title

**Form Fields (Editable):**
1. **Task Title** - Text input
2. **Priority** - Dropdown (with caret icon)
3. **Assignee** - Dropdown (with caret icon)
4. **Deal Name** - Text input
5. **Due Date** - Date picker (with calendar icon)
6. **Task Details** - Textarea

**Action Buttons:**
- **Cancel** - Red text button
- **Save** - Blue filled button

## Key Differences from Current Implementation

### ✅ What Should Stay (Matches Design)
- Contact information display
- Task title and description
- Priority field
- Due date field
- Edit/Save/Cancel functionality

### ❌ What Should Change

1. **Tabs**: 
   - Current: "Details" and "Activity" (Activity not functional)
   - Design: "Details" and "Task"
   - **Action**: Change "Activity" to "Task" or remove Activity tab

2. **Layout**:
   - Current: Complex nested sections with separators
   - Design: Simple, clean form fields in a list
   - **Action**: Simplify to match Material Design form layout

3. **Fields**:
   - Current: Many CRM fields (Client, Deal ID, Labels, Tags, etc.)
   - Design: Core fields only (Title, Priority, Assignee, Deal Name, Due Date, Details)
   - **Action**: Keep core fields, organize others better

4. **Contact Display**:
   - Current: Full contact section with avatar
   - Design: Contact info at top with avatar, name, role, relationship tag
   - **Action**: Match the design's contact layout

5. **Edit Mode**:
   - Current: Inline editing with same layout
   - Design: Clean form with labeled inputs
   - **Action**: Implement proper form layout with Material Design inputs

6. **Missing in Design**:
   - Recurrence settings (not visible in design)
   - Next Actions (not in design)
   - Recent Activity (not in design - replaced by "Task" tab)
   - Source context (not in design)
   - Account information (not in design)
   - Labels/Tags (not in design)

## Recommended Implementation

### Phase 1: Match Core Design
1. Update tabs to "Details" and "Task"
2. Simplify layout to match Material Design form
3. Reorganize contact info to top section
4. Implement proper form inputs for edit mode
5. Add Lead Stage and Engagement fields (from design)

### Phase 2: Keep Business Features (Hidden/Organized)
1. Keep recurrence settings (add to "Task" tab or advanced section)
2. Keep CRM fields (Client, Deal ID) but organize better
3. Move complex features to "Task" tab or collapsible sections

### Phase 3: Material Design Styling
1. Update colors to match design tokens:
   - Primary: #2E2E2E
   - Secondary: #5F5F5F
   - Link: #0E44AE
   - Stroke: #CBCBCB
2. Update typography to DM Sans font family
3. Match spacing and component styles

## Fields Mapping

| Design Field | Current Field | Status |
|-------------|---------------|--------|
| Task Title | title | ✅ Exists |
| Due Date | due_date | ✅ Exists (needs editing) |
| Contact | contact | ✅ Exists (needs layout update) |
| Lead Stage | priority? | ⚠️ Similar (may need new field) |
| Engagement | - | ❌ Missing |
| Priority | priority | ✅ Exists |
| Assignee | assignee | ✅ Exists |
| Deal Name | deal_id | ✅ Exists |
| Task Details | description | ✅ Exists |

## Next Steps

1. **Simplify the sidebar** to match Figma design
2. **Update tabs** to "Details" and "Task"
3. **Reorganize contact info** to top section
4. **Implement Material Design form inputs**
5. **Add missing fields** (Engagement, Lead Stage if needed)
6. **Keep business features** but organize them better

The design is much cleaner and more focused than the current implementation. We should align with it while preserving the business-critical CRM features.

