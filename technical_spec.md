# Vibe Hub - Technical Specification

## Technology Stack

### Desktop Framework
**Tauri v1.x**

**Rationale:**
- Lightweight compared to Electron (~600KB vs ~100MB)
- Uses native webview (no bundled Chromium)
- Rust backend provides security and performance
- Cross-platform ready (Windows now, Linux later)
- Active community and good documentation
- Better resource usage

### Frontend Stack
**React 18 + TypeScript**

**Rationale:**
- React: Component-based, large ecosystem, fast development
- TypeScript: Type safety, better IDE support, fewer runtime errors
- Familiar to most developers
- Great tooling and debugging

### UI Framework
**Tailwind CSS**

**Rationale:**
- Rapid UI development
- Utility-first approach reduces custom CSS
- Easy to maintain consistency
- Built-in responsive design
- Simple theming for future dark mode

### State Management
**Zustand**

**Rationale:**
- Lightweight (~1KB)
- Simple API, less boilerplate than Redux
- Good TypeScript support
- Sufficient for MVP scope
- Easy to reason about

### Build Tool
**Vite**

**Rationale:**
- Fast development server
- Optimized builds
- Great TypeScript support
- Default for modern React projects
- Integrates well with Tauri

### Additional Libraries
- **react-router-dom**: Client-side routing
- **date-fns**: Date formatting and manipulation
- **uuid**: Generate unique IDs for feedback items
- **react-markdown**: Display markdown content
- **lucide-react**: Icon library (lightweight, modern)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  ┌─────────────┐      ┌──────────────┐ │
│  │  Dashboard  │      │   Project    │ │
│  │    View     │◄────►│ Detail View  │ │
│  └─────────────┘      └──────────────┘ │
│         │                     │         │
│         └──────────┬──────────┘         │
│                    │                    │
│         ┌──────────▼──────────┐         │
│         │   Zustand Store     │         │
│         └──────────┬──────────┘         │
│                    │                    │
│         ┌──────────▼──────────┐         │
│         │   Tauri Commands    │         │
│         │    (IPC Bridge)     │         │
└─────────┴─────────────────────┴─────────┘
                    │
┌───────────────────▼───────────────────┐
│        Backend (Rust/Tauri)           │
│  ┌──────────────┐  ┌───────────────┐ │
│  │   File I/O   │  │   Process     │ │
│  │   Manager    │  │   Launcher    │ │
│  └──────────────┘  └───────────────┘ │
│  ┌──────────────┐  ┌───────────────┐ │
│  │ Git Scanner  │  │   Settings    │ │
│  │              │  │   Manager     │ │
│  └──────────────┘  └───────────────┘ │
└───────────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   File System       │
         │ - vibe-hub.md       │
         │ - vibe-hub-feedback.json │
         │ - settings.json     │
         └─────────────────────┘
```

### Frontend Architecture

```
src/
├── components/          # React components
│   ├── dashboard/
│   │   ├── ProjectCard.tsx
│   │   └── Dashboard.tsx
│   ├── project/
│   │   ├── ProjectHeader.tsx
│   │   ├── ProjectInfo.tsx
│   │   ├── FeedbackList.tsx
│   │   ├── FeedbackItem.tsx
│   │   ├── ActionsPanel.tsx
│   │   └── ProjectDetail.tsx
│   ├── feedback/
│   │   └── FeedbackModal.tsx
│   ├── settings/
│   │   └── SettingsPanel.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Modal.tsx
├── store/              # State management
│   ├── projectStore.ts
│   ├── settingsStore.ts
│   └── types.ts
├── services/           # Business logic
│   ├── tauri.ts       # Tauri command wrappers
│   └── clipboard.ts    # Clipboard operations
├── utils/             # Utilities
│   ├── formatters.ts
│   └── constants.ts
├── App.tsx            # Root component
└── main.tsx           # Entry point
```

### Backend Architecture (Rust)

```
src-tauri/
├── src/
│   ├── main.rs              # App entry point
│   ├── commands/            # Tauri commands
│   │   ├── mod.rs
│   │   ├── projects.rs      # Project scanning/loading
│   │   ├── feedback.rs      # Feedback CRUD operations
│   │   ├── settings.rs      # Settings management
│   │   └── launcher.rs      # External process launching
│   ├── models/              # Data structures
│   │   ├── mod.rs
│   │   ├── project.rs
│   │   ├── feedback.rs
│   │   └── settings.rs
│   └── utils/               # Utilities
│       ├── mod.rs
│       ├── fs.rs            # File system helpers
│       └── git.rs           # Git operations
├── Cargo.toml
└── tauri.conf.json          # Tauri configuration
```

---

## Data Models

### TypeScript Types (Frontend)

```typescript
// Project Model
interface Project {
  id: string;                    // UUID
  name: string;                  // From folder name
  path: string;                  // Absolute path
  description: string;           // From vibe-hub.md or manual
  techStack: string[];           // Tags
  deploymentUrl?: string;        // Optional
  lastModified: Date;            // From git or filesystem
  feedbackCount: number;         // Calculated
  hasUncommittedChanges: boolean; // Git status
}

// Feedback Item Model
interface FeedbackItem {
  id: string;                    // UUID
  text: string;                  // Feedback content
  priority: 1 | 2 | 3 | 4 | 5;  // Priority level
  status: 'pending' | 'completed';
  createdAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp
}

// Project Metadata (from vibe-hub.md)
interface ProjectMetadata {
  description: string;
  deploymentUrl?: string;
  techStack?: string[];
}

// Feedback File Structure
interface FeedbackFile {
  feedback: FeedbackItem[];
}

// Settings
interface Settings {
  projectsDirectory: string;
}
```

### Rust Structs (Backend)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: String,
    pub tech_stack: Vec<String>,
    pub deployment_url: Option<String>,
    pub last_modified: String,
    pub feedback_count: usize,
    pub has_uncommitted_changes: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedbackItem {
    pub id: String,
    pub text: String,
    pub priority: u8,
    pub status: String,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedbackFile {
    pub feedback: Vec<FeedbackItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub projects_directory: String,
}
```

---

## File System Structure

### Projects Directory Layout
```
~/vibe-projects/                    # User-configured root
├── project-alpha/                  # Project folder
│   ├── .git/                       # Git repo (required)
│   ├── vibe-hub.md                # Project metadata (optional)
│   ├── vibe-hub-feedback.json     # Feedback data
│   └── [project files...]
├── project-beta/
│   ├── .git/
│   ├── vibe-hub.md
│   ├── vibe-hub-feedback.json
│   └── [project files...]
└── project-gamma/
    └── [...]
```

### vibe-hub.md Format
```markdown
# Project Name

## Description
A brief description of what this project does.

## Tech Stack
- React
- TypeScript
- Tailwind CSS

## Deployment
https://my-app.vercel.app
```

### vibe-hub-feedback.json Format
```json
{
  "feedback": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "Fix the login button alignment on mobile",
      "priority": 2,
      "status": "pending",
      "createdAt": "2025-10-15T14:30:00.000Z",
      "completedAt": null
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "text": "Add dark mode support",
      "priority": 4,
      "status": "completed",
      "createdAt": "2025-10-14T10:00:00.000Z",
      "completedAt": "2025-10-15T16:45:00.000Z"
    }
  ]
}
```

### App Settings Location
- **Windows:** `%APPDATA%/com.vibehub.app/settings.json`
- **Linux:** `~/.config/com.vibehub.app/settings.json`

---

## Tauri Commands (IPC API)

### Projects

```rust
#[tauri::command]
async fn scan_projects(projects_dir: String) -> Result<Vec<Project>, String>
```
- Scans the projects directory for subdirectories with `.git` folders
- Reads `vibe-hub.md` if present
- Reads `vibe-hub-feedback.json` to count feedback items
- Gets last modified date from git or filesystem
- Returns array of Project objects

```rust
#[tauri::command]
async fn get_project_detail(project_path: String) -> Result<Project, String>
```
- Gets full details for a single project
- Includes all metadata

```rust
#[tauri::command]
async fn update_project_metadata(
    project_path: String,
    metadata: ProjectMetadata
) -> Result<(), String>
```
- Updates or creates `vibe-hub.md` with new metadata
- Manual edits to description, tech stack, deployment URL

---

### Feedback

```rust
#[tauri::command]
async fn get_feedback(project_path: String) -> Result<Vec<FeedbackItem>, String>
```
- Reads `vibe-hub-feedback.json` from project directory
- Returns sorted by priority (1 to 5)
- Creates empty file if doesn't exist

```rust
#[tauri::command]
async fn add_feedback(
    project_path: String,
    feedback: FeedbackItem
) -> Result<FeedbackItem, String>
```
- Adds new feedback item to project's feedback file
- Generates UUID and timestamp
- Returns created item

```rust
#[tauri::command]
async fn update_feedback(
    project_path: String,
    feedback_id: String,
    updates: FeedbackItem
) -> Result<(), String>
```
- Updates existing feedback item
- Used for editing text/priority or marking complete

```rust
#[tauri::command]
async fn delete_feedback(
    project_path: String,
    feedback_id: String
) -> Result<(), String>
```
- Removes feedback item from file

---

### Launcher

```rust
#[tauri::command]
async fn launch_claude_code(
    project_path: String,
    prompt: String
) -> Result<(), String>
```
- Copies prompt to system clipboard
- Spawns new terminal window in project directory
- Launches `claude` CLI command
- Platform-specific terminal spawning:
  - Windows: `cmd.exe /c start cmd /k "cd /d {path} && claude"`
  - Linux: `gnome-terminal -- bash -c "cd {path} && claude"`

```rust
#[tauri::command]
async fn open_in_explorer(project_path: String) -> Result<(), String>
```
- Opens file explorer at project location
- Windows: `explorer.exe`
- Linux: `xdg-open`

```rust
#[tauri::command]
async fn open_url(url: String) -> Result<(), String>
```
- Opens URL in default browser
- For deployment URLs

---

### Settings

```rust
#[tauri::command]
async fn get_settings() -> Result<Settings, String>
```
- Reads settings from app config directory
- Returns Settings object

```rust
#[tauri::command]
async fn update_settings(settings: Settings) -> Result<(), String>
```
- Saves settings to app config directory

```rust
#[tauri::command]
async fn select_directory() -> Result<Option<String>, String>
```
- Opens native directory picker dialog
- Returns selected path or None

---

## Frontend State Management

### Project Store (Zustand)

```typescript
interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  feedback: FeedbackItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  setCurrentProject: (projectId: string) => Promise<void>;
  refreshProject: (projectId: string) => Promise<void>;

  addFeedback: (projectPath: string, feedback: Omit<FeedbackItem, 'id' | 'createdAt'>) => Promise<void>;
  updateFeedback: (projectPath: string, feedbackId: string, updates: Partial<FeedbackItem>) => Promise<void>;
  deleteFeedback: (projectPath: string, feedbackId: string) => Promise<void>;
  toggleFeedbackComplete: (projectPath: string, feedbackId: string) => Promise<void>;

  launchClaudeCode: (projectPath: string, feedbackIds?: string[]) => Promise<void>;
  openInExplorer: (projectPath: string) => Promise<void>;
  openDeploymentUrl: (url: string) => Promise<void>;
}
```

### Settings Store (Zustand)

```typescript
interface SettingsStore {
  // State
  settings: Settings | null;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateProjectsDirectory: (path: string) => Promise<void>;
  selectDirectory: () => Promise<string | null>;
}
```

---

## Key Algorithms

### Project Scanning Algorithm

```rust
async fn scan_projects(projects_dir: String) -> Result<Vec<Project>, String> {
    1. Read directory entries from projects_dir
    2. Filter for subdirectories only
    3. For each subdirectory:
       a. Check if .git folder exists (skip if not)
       b. Generate project ID (UUID or hash of path)
       c. Extract name from folder name
       d. Check for vibe-hub.md:
          - If exists: parse description, tech stack, deployment URL
          - If not: use empty/default values
       e. Get last modified date:
          - Try: git log -1 --format=%ci
          - Fallback: directory modification time
       f. Check git status for uncommitted changes
       g. Read vibe-hub-feedback.json and count items
       h. Build Project struct
    4. Sort projects by last modified (newest first)
    5. Return Vec<Project>
}
```

### Feedback Sorting

Feedback items are sorted by priority ascending (1 = Critical first):
```rust
feedback.sort_by(|a, b| a.priority.cmp(&b.priority));
```

### Claude Code Prompt Generation

```typescript
function generateClaudePrompt(
  projectName: string,
  feedbackItems: FeedbackItem[]
): string {
  const priorityLabels = {
    1: 'Critical',
    2: 'High Priority',
    3: 'Medium',
    4: 'Low Priority',
    5: 'Nice to Have'
  };

  const header = `I need help with the following feedback items for ${projectName}:\n\n`;

  const items = feedbackItems
    .map((item, index) =>
      `${index + 1}. [${priorityLabels[item.priority]}] ${item.text}`
    )
    .join('\n');

  const footer = '\n\nPlease review these items and suggest how to approach them.';

  return header + items + footer;
}
```

---

## Error Handling

### Strategy
- **Frontend:** Try-catch blocks with user-friendly error messages
- **Backend:** Return `Result<T, String>` from all commands
- **File I/O:** Graceful degradation (create missing files, skip invalid projects)

### Error Categories

**File System Errors:**
- Directory not found → Prompt user to select valid directory
- Permission denied → Show error with instructions
- Malformed JSON → Show error, offer to reset file

**Git Errors:**
- Not a git repo → Skip project (already handled in scan)
- Git command failed → Fall back to filesystem timestamps

**Process Spawn Errors:**
- Claude Code not installed → Show error with installation instructions
- Terminal not found → Show error message

---

## Build & Development

### Development Commands

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run tauri dev

# Build for production
npm run tauri build

# Run frontend only (without Tauri)
npm run dev

# Lint
npm run lint

# Type check
npm run type-check
```

### Build Output

**Windows:**
- Installer: `src-tauri/target/release/bundle/msi/Vibe Hub_1.0.0_x64_en-US.msi`
- Portable: `src-tauri/target/release/vibe-hub.exe`

**Linux (future):**
- AppImage: `src-tauri/target/release/bundle/appimage/vibe-hub_1.0.0_amd64.AppImage`
- Deb: `src-tauri/target/release/bundle/deb/vibe-hub_1.0.0_amd64.deb`

---

## Performance Considerations

### Optimization Strategies

**Project Scanning:**
- Scan in background/async
- Cache results (re-scan only when needed)
- Limit depth of directory traversal
- Skip large node_modules, build folders

**Feedback Loading:**
- Load only when viewing project detail
- Keep files small (archive old completed feedback if needed)

**UI Rendering:**
- Virtual scrolling if > 100 projects (defer for now)
- Lazy load project details
- Debounce search/filter inputs (future feature)

**Memory:**
- Don't keep all project data in memory
- Load project details on-demand
- Clear current project when navigating away

---

## Security Considerations

**File System Access:**
- Tauri's security model limits filesystem access
- Only allow reading from user-selected projects directory
- Validate all file paths to prevent directory traversal

**Process Spawning:**
- Only allow spawning known commands (claude, explorer)
- Sanitize project paths before passing to shell
- Don't allow arbitrary command execution

**XSS Prevention:**
- Sanitize markdown rendering
- Use React's built-in XSS protection
- Don't use dangerouslySetInnerHTML except for markdown

---

## Testing Strategy

### Unit Tests
- Rust: Test file parsing, project scanning logic
- TypeScript: Test utilities, formatters, prompt generation

### Integration Tests
- Test Tauri commands with mock filesystem
- Test state management store actions

### E2E Tests (Deferred)
- Not critical for MVP
- Can add later with Playwright or Tauri's testing tools

### Manual Testing Checklist
- First launch (no settings)
- Select projects directory
- View project list
- Open project detail
- Add feedback
- Edit feedback
- Delete feedback
- Mark complete
- Launch Claude Code
- Open in explorer
- Change settings

---

## Deployment & Distribution

### Initial Release (MVP)
- Build Windows MSI installer
- Manual distribution (no auto-updates yet)
- GitHub releases

### Future
- Auto-update mechanism (Tauri Updater)
- Code signing certificate
- Linux builds
- Maybe: Homebrew, Chocolatey, AUR packages

---

## Development Phases

### Phase 1: Setup & Basic Structure (Week 1)
- Initialize Tauri + React project
- Set up TypeScript, Tailwind, Zustand
- Create basic project structure
- Implement settings storage
- Build simple UI shell

### Phase 2: Project Scanning (Week 1-2)
- Implement project scanning in Rust
- Git integration for metadata
- Parse vibe-hub.md files
- Display projects in dashboard
- Project detail view

### Phase 3: Feedback System (Week 2-3)
- Implement feedback CRUD operations
- File I/O for feedback JSON
- Feedback modal UI
- Priority system
- Mark complete functionality

### Phase 4: Claude Integration (Week 3)
- Prompt generation
- Clipboard operations
- Terminal/Claude Code launching
- Test on Windows

### Phase 5: Polish & Testing (Week 4)
- Error handling
- Loading states
- Empty states
- Manual testing
- Bug fixes
- Documentation

---

## Open Technical Questions

1. **Icon design:** Need app icon for Windows (ico format)
2. **App name final:** "Vibe Hub" or "VibeHub" for bundle ID?
3. **Git operations:** Use git CLI or libgit2 library?
4. **Markdown parsing:** Allow full markdown or sanitize subset?
5. **Completed feedback:** Archive after 30 days or keep forever?

---

## Success Metrics (Technical)

- ✓ App launches in < 2 seconds
- ✓ Project scanning completes in < 3 seconds for 20 projects
- ✓ Feedback operations feel instant (< 100ms)
- ✓ No crashes during normal operation
- ✓ Works on Windows 10 & 11
- ✓ Bundle size < 10MB
- ✓ Memory usage < 100MB when idle
