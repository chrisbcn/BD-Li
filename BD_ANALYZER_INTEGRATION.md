# BD Analyzer Integration Plan

## How Task Manager + BD Analyzer Work Together

### The Connection

**Task Manager** (Action Layer):
- Creates tasks from emails, LinkedIn, manual entry
- Tracks activities (emails, calls, meetings)
- Manages follow-ups and to-dos

**BD Analyzer** (Analysis Layer):
- Analyzes all activities to calculate lead scores
- Identifies Hot/Warm/Cold contacts
- Suggests who to prioritize
- Generates insights and recommendations

**The Flow**:
```
Activities → BD Analyzer → Lead Scores → Task Priorities → Actions
     ↑                                                           ↓
     └─────────────────── Feedback Loop ────────────────────────┘
```

## What We've Built vs BD Analyzer PRD

### ✅ Already Implemented
- Contact management (CRUD)
- Activity tracking (email, call, meeting, LinkedIn, etc.)
- Basic relationship strength calculation
- Multi-channel integration foundation (email agent, LinkedIn agent)
- Contact-task linking

### 🔄 Needs Enhancement (BD Analyzer Concepts)
- **Lead Scoring**: Currently simple, needs BD Analyzer's 3-factor algorithm
- **Response Tracking**: Activities tracked but response rates not calculated
- **Temperature Classification**: Not implemented yet
- **Analytics Dashboard**: Not built yet
- **CSV Import**: Not implemented yet

## Integration Plan

### Phase 1: Enhanced Lead Scoring (Now)
- ✅ Implement BD Analyzer's scoring algorithm:
  - Recency (40%): Days since last interaction
  - Frequency (30%): Number of recent interactions  
  - Engagement (30%): Response rate to outreach
- ✅ Add temperature classification (Hot/Warm/Cold)
- ✅ Update contact service to use new scoring

### Phase 2: Response Tracking (Next)
- Track which activities are outbound vs inbound
- Calculate response rates per contact
- Update engagement scores based on responses
- Add response time tracking

### Phase 3: Analytics Dashboard (Future)
- Temperature distribution charts
- Activity timelines
- Response rate metrics
- Pipeline velocity
- Optimal contact timing analysis

### Phase 4: CSV Import (Future)
- LinkedIn connections import
- Custom contact lists
- SMS/text message logs
- Field mapping and deduplication

## Database Schema Updates Needed

### Add to Activities Table
```sql
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_outbound BOOLEAN DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS response_received BOOLEAN DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS response_time_hours INTEGER;
```

### Add to Contacts Table
```sql
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2);
```

## How Agents Feed BD Analyzer

### Email Agent
1. Processes email → Creates activity
2. Marks as outbound/inbound
3. Tracks if response received
4. Updates contact's last_contact_date
5. Triggers lead score recalculation

### LinkedIn Agent
1. Syncs connections → Creates/updates contacts
2. Tracks LinkedIn interactions → Creates activities
3. Calculates relationship strength
4. Generates reconnection suggestions (based on lead scores)
5. Creates tasks for Hot/Warm contacts

### Lead Scoring Agent (New)
1. Runs daily/weekly
2. Recalculates all lead scores using BD Analyzer algorithm
3. Updates temperature classifications
4. Creates tasks for Hot leads that need attention
5. Generates insights for dashboard

## Task Priority Based on Lead Score

When creating tasks from BD Analyzer insights:
- **Hot contacts (71-100)**: High priority tasks
- **Warm contacts (31-70)**: Medium priority tasks
- **Cold contacts (0-30)**: Low priority tasks (or skip)

## Next Steps

1. ✅ Implement BD Analyzer lead scoring algorithm
2. ⏳ Add response tracking to activities
3. ⏳ Update database schema for new fields
4. ⏳ Build analytics dashboard
5. ⏳ Add CSV import functionality
6. ⏳ Create lead scoring agent (scheduled job)

