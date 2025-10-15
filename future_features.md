# Vibe Hub - Future Features (Post-MVP)

Features and enhancements deferred for future phases after MVP is validated.

---

## Phase 2: Enhanced Feedback System

### Remote Feedback Submission
**Description:** Allow users to submit feedback directly from their deployed apps

**Components:**
- Cloud database for feedback storage
- API endpoint for feedback submission
- Authentication/authorization system (API keys per project)
- Automatic sync between cloud and local
- In-app review flow for incoming feedback

**Use case:** User is using one of your deployed apps, clicks "Send Feedback" button, feedback appears in Vibe Hub automatically

**Complexity:** High (requires backend, database, API, auth)

---

### Rich Feedback Content
**Description:** Support more than just text in feedback items

**Additions:**
- Screenshots/images
- Screen recordings
- Browser/device info (for web apps)
- Error logs/stack traces
- User annotations on screenshots

**Use case:** Bug reports with visual context, design feedback with marked-up screenshots

---

### Feedback Categories & Tags
**Description:** Organize feedback beyond just priority

**Features:**
- Custom tags (bug, feature, design, performance, etc.)
- Filter by category
- Bulk operations on tagged items
- Tag-based prompt generation for Claude

---

### Feedback Threading
**Description:** Support comments/discussion on feedback items

**Features:**
- Add notes to feedback items
- Track discussion over time
- Link related feedback items
- Reference in commit messages

---

## Phase 3: Advanced Claude Integration

### Direct Claude API Integration
**Description:** Send prompts directly to Claude without clipboard/manual steps

**Features:**
- One-click "Ask Claude" with feedback context
- Claude responses stored in app
- Track which feedback Claude has reviewed
- Multi-turn conversations within app
- Session history

**Benefits:**
- Seamless workflow
- No context switching
- Feedback resolution tracking

---

### Intelligent Prompt Generation
**Description:** Smarter prompts based on context

**Features:**
- Analyze codebase to include relevant context
- Different prompt templates for different types of feedback
- Include recent commits/changes
- Reference similar past feedback
- Suggest related issues to work on together

---

### Progress Tracking
**Description:** Track Claude's work on feedback items

**Features:**
- Link feedback to commits
- See which items Claude has addressed
- Automatic status updates based on commits
- "Changes since last review" view

---

## Phase 4: Visual Design Support

### Image/Mockup Management
**Description:** Store and view visual design materials

**Features:**
- Upload screenshots, mockups, design files
- Image viewer/gallery per project
- Annotate images
- Compare before/after
- Link images to feedback items

---

### Design System Documentation
**Description:** Document and track design decisions

**Features:**
- Color palette storage
- Typography guidelines
- Component documentation
- Design token tracking
- Link to Figma/design tools

---

## Phase 5: Analytics & Insights

### Project Health Dashboard
**Description:** Get insights into project activity and progress

**Metrics:**
- Feedback completion rate
- Time to resolve by priority
- Most active projects
- Feedback trends over time
- Commit activity correlation

---

### AI-Powered Insights
**Description:** Use AI to analyze feedback and suggest actions

**Features:**
- Detect duplicate/similar feedback
- Suggest priority adjustments
- Group related items
- Identify patterns (e.g., "Many UI feedback items lately")
- Recommend what to work on next

---

## Phase 6: Team Collaboration (Maybe)

**Note:** Originally scoped as solo-dev tool, but could expand

**Potential Features:**
- Share projects with others
- Assign feedback items
- Team comments/discussion
- Shared deployment tracking
- Permission levels

**Decision point:** Would need to validate if there's demand for this without losing the simplicity

---

## Technical Improvements

### Cross-Platform Support
**Description:** Extend beyond Windows

**Targets:**
- Linux
- macOS
- Potentially mobile (for quick feedback entry on-the-go)

---

### Performance Optimizations
**For when:**
- Managing 100+ projects
- 1000+ feedback items
- Large markdown files

**Approaches:**
- Lazy loading
- Virtual scrolling
- Search indexing
- Background scanning

---

### Cloud Sync (Optional)
**Description:** Sync app data across devices

**Approaches considered:**
- Git-based (commit feedback files, push/pull)
- Simple cloud storage (Firebase, Supabase)
- Dropbox-style file sync
- Conflict resolution strategy

**Use case:** Work on desktop at home, review on laptop elsewhere

---

## Integration Ideas

### IDE Integration
- VS Code extension to view/add feedback without leaving editor
- JetBrains plugin
- Two-way sync

### Git Integration
- Auto-close feedback items referenced in commits
- Include feedback ID in commit messages
- Generate changelog from completed feedback

### Deployment Platform Integration
- Auto-detect deployment URLs from Vercel/Netlify/etc.
- Show deployment status/health
- Link feedback to specific deployed versions

### Other AI Tools
- Integrate with other AI coding assistants
- Export feedback to different formats
- Import from other project management tools

---

## Nice-to-Have Polish

### Keyboard Shortcuts
- Quick navigate between projects
- Add feedback without mouse
- Launch Claude with keyboard

### Customization
- Custom priority labels/colors
- Project templates
- Feedback templates
- Personalized prompt templates

### Export/Backup
- Export projects list
- Export feedback as CSV/JSON
- Backup entire Vibe Hub state
- Import from other tools

### Smart Notifications
- Desktop notifications for new feedback (when cloud sync enabled)
- Reminders about high-priority items
- "You haven't worked on Project X in 2 weeks"

---

## Questions to Answer Before Building These

1. Is the MVP actually useful? Does anyone use it?
2. Which pain point is most acute after using MVP?
3. Is remote feedback actually needed, or is manual entry fine?
4. Do users want AI to be more automatic, or keep human in control?
5. Is this still a solo-dev tool, or expanding scope?

**Principle:** Let MVP usage inform which features actually matter.
