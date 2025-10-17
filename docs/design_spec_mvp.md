# Vibe Hub - MVP Design Specification

## Purpose

Vibe Hub is a desktop companion app for managing personal vibe-coding projects. It provides a central dashboard to view all your projects, track feedback and improvements, prioritize work, and quickly launch Claude Code to work on specific issues.

**What it is:**
- A project overview dashboard
- A feedback management system
- A quick launcher for development tools

**What it is NOT:**
- Not a code editor
- Not an IDE
- Not a team collaboration tool

---

## User Scenarios

### Scenario 1: Daily Check-in
Sarah opens Vibe Hub to see all her personal projects. She sees which projects have pending feedback, checks deployment status, and decides which project to work on today.

### Scenario 2: Adding Feedback
While testing one of her apps, Sarah thinks of an improvement. She opens Vibe Hub, navigates to that project, and adds a new feedback item with priority level 3.

### Scenario 3: Working Through Issues
Sarah selects her highest priority feedback items, clicks a button to launch Claude Code with a pre-written prompt about those issues, and starts working on them.

---

## Information Architecture

```
Vibe Hub
├── Dashboard (Projects Overview)
│   └── Project Cards
│       └── Quick Info + Actions
│
└── Project Detail View
    ├── Project Information
    ├── Feedback List
    └── Actions Panel
```

---

## Screens & Views

### 1. Dashboard View (Main Screen)

**Purpose:** Overview of all projects at a glance

**Layout:**
- Header with app title and settings button
- Grid or list of project cards
- Each card shows:
  - Project name
  - Short description (1-2 lines)
  - Number of feedback items (with badge showing count)
  - Deployment status indicator (deployed/not deployed)
  - Last modified date
  - Quick action buttons:
    - "Open Project" (navigate to detail view)
    - "Open in Claude Code" (launches Claude Code CLI in that directory)

**Interactions:**
- Click card → Navigate to Project Detail View
- Click "Open in Claude Code" → Launch Claude Code CLI in project directory
- Refresh button → Re-scan projects folder for new/updated projects

**Empty State:**
- If no projects found: Message explaining how to set up projects folder
- Link to settings to configure projects directory

---

### 2. Project Detail View

**Purpose:** View and manage a specific project and its feedback

**Layout:**

#### A. Project Header
- Project name (large, prominent)
- Description (editable markdown text)
- Deployment URL (if exists, clickable link)
- Tech stack tags
- Back button to Dashboard

#### B. Project Information Section
- Description/overview in markdown
- Can be edited inline or loaded from project's README/docs
- Visual indication if loaded from file vs. manually entered

#### C. Feedback List Section
- Title: "Feedback & Improvements"
- List of feedback items (sorted by priority, highest to lowest), each showing:
  - Checkbox (for marking complete)
  - Feedback text
  - Priority badge (1-5 with color coding and label)
  - Date added
  - Edit/Delete buttons

**Priority Scale:**
- 1: Critical (red)
- 2: High Priority (orange)
- 3: Medium (yellow)
- 4: Low Priority (blue)
- 5: Nice to Have (gray)

#### D. Actions Panel
- "Add Feedback" button
- "Open Claude Code" button with dropdown:
  - "Open with all feedback context"
  - "Open with selected feedback only"
  - "Open blank"
- "Open in File Explorer" button
- "Open Deployed App" button (if deployed)

**Interactions:**
- Click "Add Feedback" → Opens modal/panel to create new feedback item
- Click feedback item → Expands to show full text and edit options
- Check/uncheck feedback → Marks as complete/incomplete
- Select multiple feedback items → Enables "Work on selected" action
- Click "Open Claude Code" → Launches Claude Code CLI with prompt copied to clipboard containing relevant feedback

---

### 3. Add/Edit Feedback Modal

**Purpose:** Create or modify a feedback item

**Layout:**
- Feedback text (multiline text area)
- Priority selector (1-5 with visual labels)
- Date (auto-filled)
- Cancel / Save buttons

**Validation:**
- Feedback text is required
- Priority is required

---

### 4. Settings Panel

**Purpose:** Configure app behavior

**Settings:**
- Projects Directory Path (with folder picker)

---

## Data Model (Conceptual)

### Project
- Name (from folder name)
- Path (absolute path to project folder)
- Description (from markdown file or manual entry)
- Tech Stack (auto-detected or manual)
- Deployment URL (optional)
- Last Modified (from git/file system)
- Feedback Items (list)

### Feedback Item
- ID (unique)
- Text (string)
- Priority (1-5)
- Status (pending/completed)
- Date Created
- Date Completed (optional)

---

## Key Design Decisions

### Decision 1: Feedback Storage Location
**Chosen approach:** Store feedback inside each project folder as a `vibe-hub-feedback.json` file

**Rationale:**
- Keeps feedback with the project (travels with the repo if needed)
- Makes feedback visible to Claude Code when working in that directory
- Local-first by default
- Simple to implement
- No separate database needed

**Format:**
```json
{
  "feedback": [
    {
      "id": "unique-id",
      "text": "Fix the login button alignment",
      "priority": 2,
      "status": "pending",
      "createdAt": "2025-10-15T10:30:00Z"
    }
  ]
}
```

### Decision 2: Project Discovery
**Chosen approach:** Scan a single designated "Projects" directory where each subfolder (containing a git repo) is a project

**Rationale:**
- Simple mental model
- Encourages organization
- Easy to implement
- Matches user's stated preference

### Decision 3: Project Information Source
**Chosen approach:** Look for a `vibe-hub.md` file in project root for description/metadata. If not found, allow manual entry.

**Rationale:**
- Encourages documentation within the project
- Fallback to manual entry for flexibility
- Markdown keeps it simple and readable

### Decision 4: Claude Code Integration
**Chosen approach:** Launch Claude Code CLI with a generated prompt copied to clipboard

**Flow:**
1. User clicks "Open Claude Code" with selected feedback
2. App generates a prompt like:
   ```
   I need help with the following feedback items for [Project Name]:

   1. [Priority 1] Fix critical bug in authentication
   2. [Priority 2] Improve dashboard loading speed

   Please review these items and suggest how to approach them.
   ```
3. Prompt is copied to clipboard
4. Claude Code CLI launches in project directory
5. User pastes the prompt to start working

**Rationale:**
- Simple to implement
- No API needed
- Works with current Claude Code CLI
- User maintains control
- Easy to iterate on prompt templates

### Decision 5: Metadata to Track
**Auto-detected:**
- Project name (folder name)
- Last modified (git last commit date or file system)
- Git status (clean/uncommitted changes)
- Presence of deployment URL (from vibe-hub.md)

**Manual:**
- Description
- Tech stack
- Deployment URL (if not in vibe-hub.md)

---

## User Flows

### Flow 1: First-Time Setup
1. User opens Vibe Hub
2. App prompts to select Projects directory
3. User selects folder
4. App scans and displays found projects
5. Dashboard populated with project cards

### Flow 2: Adding Feedback
1. User on Dashboard → clicks project card
2. Project Detail View opens
3. User clicks "Add Feedback"
4. Modal opens
5. User enters text, selects priority
6. User clicks Save
7. Feedback appears in list
8. Feedback file updated in project folder

### Flow 3: Working on Issues with Claude
1. User on Project Detail View
2. User selects 2-3 high-priority feedback items (or views all)
3. User clicks "Open Claude Code" → "with selected feedback"
4. App generates prompt with feedback context
5. Prompt copied to clipboard
6. Claude Code CLI launches in project directory
7. User pastes and starts conversation with Claude

### Flow 4: Completing Feedback
1. User works on issues
2. Returns to Vibe Hub
3. Checks off completed feedback items
4. Items marked as complete (with timestamp)

---

## Visual Design Guidelines

### Overall Aesthetic
- Clean, minimal interface
- Focus on content, not chrome
- Quick to scan and navigate
- Professional but not corporate

### Layout Principles
- Generous whitespace
- Clear hierarchy (titles, content, actions)
- Consistent spacing and alignment
- Readable typography (no tiny fonts)

### Color Scheme
- Neutral background (white/light gray or dark mode equivalent)
- Priority color coding: Red → Orange → Yellow → Blue → Gray
- Accent color for primary actions (your choice)
- Subtle colors for secondary information

### Typography
- Clear hierarchy: Large project names, medium body text, small metadata
- Monospace for file paths/technical info
- Sans-serif for UI

---

## MVP Feature Checklist

**Must Have:**
- ✓ Dashboard with project cards
- ✓ Project detail view
- ✓ Add/edit/delete feedback
- ✓ Priority system (1-5)
- ✓ Mark feedback as complete
- ✓ Launch Claude Code in project directory
- ✓ Generate Claude prompt with feedback context
- ✓ Auto-scan projects folder
- ✓ Load project info from markdown files
- ✓ Store feedback in project folders

**Not in MVP:**
- Remote feedback submission
- Cloud sync
- Screenshots/images
- Analytics/insights
- Team collaboration
- Claude API integration
- Progress tracking over time

---

## Success Criteria

The MVP is successful if:
1. User can see all their projects in one place
2. User can quickly add feedback to any project
3. User can launch Claude Code with relevant feedback context
4. All data stays local (no cloud dependency)
5. App feels fast and responsive
6. User prefers this over scattered notes/files
