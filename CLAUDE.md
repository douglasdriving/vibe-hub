# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Hub is a desktop companion app for managing personal vibe-coding projects. It's built with Tauri (Rust backend) + React + TypeScript, and provides a dashboard to view projects, track feedback/improvements, and launch Claude Code with context about specific issues.

**Key Characteristics:**
- Local-first: All data stored in project folders
- No cloud services or APIs
- Feedback stored as JSON files in each project (`vibe-hub-feedback.json`)
- Project metadata stored in `vibe-hub.md` files
- Scans a designated projects directory for git repositories

## Development Commands

### Frontend Development
```bash
npm install           # Install dependencies
npm run dev          # Run Vite dev server only (no Tauri)
npm run build        # Build frontend (TypeScript + Vite)
```

### Tauri Development
```bash
npm run tauri dev    # Run full app with hot reload
npm run tauri build  # Build production executable
```

### Testing
```bash
npm test             # Run tests once with Vitest
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

cd src-tauri && cargo test  # Run Rust tests
```

### Utility Scripts for Claude Workflows

These scripts reduce token usage by fetching only the data Claude needs:

```bash
# Get pending issues only (excludes 108+ completed issues from archive)
python scripts/get-pending-issues.py

# Get raw pending feedback only (excludes archived feedback)
python scripts/get-raw-feedback.py

# Get high-level project summary without loading full issue/feedback data
python scripts/get-project-summary.py
```

**Usage in Claude sessions:**
Instead of reading entire files, use these scripts to get targeted data. For example:
- When refining feedback, use `get-raw-feedback.py` instead of reading feedback.json directly
- When fixing issues, use `get-pending-issues.py` instead of reading the full issues.json
- For quick project status checks, use `get-project-summary.py`

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Zustand (state management)
- **Backend**: Rust + Tauri 2.x
- **Build Tool**: Vite
- **Testing**: Vitest (frontend), Cargo test (backend)

### Communication Pattern
Frontend components → Zustand stores → Tauri service wrapper (`src/services/tauri.ts`) → Tauri commands (Rust) → File system operations

The Tauri IPC bridge is wrapped in `src/services/tauri.ts` which provides type-safe functions that invoke Rust commands.

### Key Directories

**Frontend** (`src/`):
- `components/`: React components organized by feature (dashboard, project, feedback, settings, common)
- `store/`: Zustand stores (`projectStore.ts`, `settingsStore.ts`) + types
- `services/`: Business logic (Tauri command wrappers, clipboard operations)
- `utils/`: Formatters and constants

**Backend** (`src-tauri/src/`):
- `commands/`: Tauri command handlers (projects, feedback, settings, launcher)
- `models/`: Rust data structures (Project, FeedbackItem, Settings)
- `main.rs` & `lib.rs`: App entry points

### State Management with Zustand

Two main stores:
1. **projectStore.ts**: Manages projects list, current project, and feedback operations
2. **settingsStore.ts**: Manages app settings (primarily projects directory path)

Stores call Tauri commands via `src/services/tauri.ts` wrapper functions.

### Tauri Commands (IPC API)

All commands defined in `src-tauri/src/commands/`:

**Projects** (`projects.rs`):
- `scan_projects(projects_dir)`: Scans for git repos, returns Project array
- `get_project_detail(project_path)`: Gets full details for one project

**Feedback** (`feedback.rs`):
- `get_feedback(project_path)`: Reads feedback JSON from project
- `add_feedback(project_path, feedback)`: Adds new feedback item
- `update_feedback(project_path, feedback_id, updates)`: Updates existing item
- `delete_feedback(project_path, feedback_id)`: Removes feedback item

**Launcher** (`launcher.rs`):
- `launch_claude_code(project_path, prompt)`: Copies prompt to clipboard, spawns terminal with `claude` command
- `open_in_explorer(project_path)`: Opens file explorer at project location
- `open_url(url)`: Opens URL in default browser

**Settings** (`settings.rs`):
- `get_settings()`: Reads settings from app config directory
- `update_settings(settings)`: Saves settings
- `select_directory()`: Opens native directory picker dialog

## Data Storage

### File Structure in Projects Directory
```
~/vibe-projects/
├── my-project/
│   ├── .git/                          # Required (only git repos are scanned)
│   ├── vibe-hub.md                    # Optional: Project metadata
│   ├── vibe-hub-feedback.json         # Feedback items (created automatically)
│   └── [project files...]
```

### vibe-hub.md Format
```markdown
# Project Name

## Description
Brief description of the project.

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
      "id": "uuid",
      "text": "Feedback text",
      "priority": 1-5,
      "status": "pending" | "completed",
      "createdAt": "ISO 8601 timestamp",
      "completedAt": "ISO 8601 timestamp" | null
    }
  ]
}
```

### App Settings Location
- **Windows**: `%APPDATA%/com.vibehub.app/settings.json`
- **Linux**: `~/.config/com.vibehub.app/settings.json`

## Project Scanning Algorithm

Located in `src-tauri/src/commands/projects.rs`:

1. Read directory entries from configured projects directory
2. Filter for directories containing `.git` folder
3. For each valid project:
   - Parse `vibe-hub.md` for description, tech stack, deployment URL
   - Read `vibe-hub-feedback.json` to count pending feedback
   - Get last modified date from filesystem
   - Build Project struct
4. Sort projects by last modified (newest first)

## Important Implementation Details

### Project ID Generation
**Critical**: Each `scan_projects` call generates new UUIDs for projects. This means project IDs are NOT stable across scans. The `refreshProject` function in the store handles this by matching on `project.path` instead.

### Feedback Sorting
Feedback items are always sorted by priority ascending (1 = Critical first, 5 = Nice to Have last).

### Claude Code Prompt Generation
Located in `src/services/clipboard.ts`. Format:
```
I need help with the following feedback items for [Project Name]:

1. [Critical] Feedback item text
2. [High Priority] Another item

Please review these items and suggest how to approach them.
```

### Error Handling Strategy
- **Backend**: All Tauri commands return `Result<T, String>`
- **Frontend**: Try-catch blocks with error state in stores
- **File I/O**: Graceful degradation (creates missing files, skips invalid projects)

## Modifying the Codebase

### Adding a New Tauri Command

1. Add Rust function in appropriate `src-tauri/src/commands/*.rs` file:
```rust
#[tauri::command]
pub async fn my_command(param: String) -> Result<ReturnType, String> {
    // Implementation
    Ok(result)
}
```

2. Register in `src-tauri/src/commands/mod.rs` and `src-tauri/src/lib.rs`

3. Add TypeScript wrapper in `src/services/tauri.ts`:
```typescript
export async function myCommand(param: string): Promise<ReturnType> {
  return await invoke('my_command', { param });
}
```

4. Call from store or component via `tauri.myCommand()`

### Adding a New Store Action

1. Add action function to the store in `src/store/projectStore.ts` or `settingsStore.ts`
2. Update state using `set()` function
3. Call Tauri commands via `src/services/tauri.ts` wrapper
4. Handle errors appropriately (set error state or throw)

### Adding UI Components

Components are organized by feature in `src/components/`:
- `common/`: Reusable UI primitives (Button, Input, Modal)
- `dashboard/`: Dashboard view components
- `project/`: Project detail view components
- `feedback/`: Feedback modal and related components
- `settings/`: Settings panel

Use Tailwind CSS for styling. Common components in `common/` provide consistent styling.

## Testing

### Frontend Testing (Vitest)
- Test files colocated with source: `*.test.ts` or `*.test.tsx`
- Setup in `src/test/setup.ts`
- Use `@testing-library/react` for component testing
- Mock Tauri commands when needed

### Backend Testing (Cargo)
- Unit tests in Rust files using `#[cfg(test)]` modules
- Run with `cd src-tauri && cargo test`
- Use temp directories for file I/O tests

## Common Development Patterns

### Loading Data in Components
```typescript
const { projects, loadProjects, isLoading } = useProjectStore();

useEffect(() => {
  loadProjects();
}, [loadProjects]);
```

### Calling Store Actions
```typescript
const { addFeedback } = useProjectStore();

await addFeedback(projectPath, {
  text: "Feedback text",
  priority: 2,
  status: "pending"
});
```

### Error Handling
```typescript
try {
  await someStoreAction();
} catch (error) {
  console.error('Failed:', error);
  // Show user-friendly error message
}
```

## Platform-Specific Notes

### Windows
- Terminal spawning uses `cmd.exe /c start cmd /k "cd /d {path} && claude"`
- File explorer opens with `explorer.exe`
- Settings stored in `%APPDATA%`

### Linux (Future Support)
- Terminal spawning should use `gnome-terminal` or similar
- File explorer opens with `xdg-open`
- Settings stored in `~/.config/`

## Design Spec References

For detailed feature specifications, UI/UX decisions, and user flows, see:
- `design_spec_mvp.md`: MVP feature specs and user scenarios
- `technical_spec.md`: Complete technical architecture and data models
- `app_idea_vibe_hub.md`: Original concept and problem statement
- `design_clarifications.md`: Design decisions made during planning
