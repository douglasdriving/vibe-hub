# Vibe Hub

A local-first desktop companion for managing personal vibe-coding projects, built with Tauri + React + TypeScript.

## Features

- 📁 **Project Dashboard** - Scan and view all your projects in one place
- 📝 **Feedback Tracking** - Capture and prioritize improvements for each project
- 🚀 **Claude Integration** - Launch Claude Code with context about specific feedback items
- 🎨 **Vibrant UI** - Colorful, fun interface for tracking your creative projects
- 💾 **Local-First** - All data stored in your project folders (`.vibe/` directory)
- 🔄 **Auto-Migration** - Automatically organizes and maintains project metadata

## Quick Start

### Prerequisites

- Node.js (v18+)
- Rust (latest stable)
- npm or yarn

### Development

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run tauri dev
```

### Building for Production

#### Windows

Double-click `build.bat` or run:

```bash
build.bat
```

The installer will be generated at: `src-tauri\target\release\bundle\msi\`

#### Manual Build

```bash
npm install
npm run build
npm run tauri build
```

## Project Structure

```
vibe-hub/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── store/           # Zustand state management
│   ├── services/        # Business logic layer
│   └── utils/           # Helper functions
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── commands/    # Tauri command handlers
│   │   └── models/      # Data structures
│   └── tauri.conf.json  # Tauri configuration
├── docs/                # Design and technical documentation
├── CLAUDE.md            # Instructions for Claude Code
└── build.bat            # Windows build script
```

## How It Works

### Data Storage

Each project you track stores its data locally in a `.vibe/` folder:

```
your-project/
├── .vibe/
│   ├── metadata.md      # Project description, status, tech stack
│   └── feedback.json    # Feedback items and their status
└── ... (your project files)
```

The `.vibe/` folder is automatically added to `.gitignore` to keep feedback local.

### Workflow

1. **Select Projects Directory** - Point Vibe Hub at your projects folder
2. **Auto-Discovery** - All subfolders are automatically detected
3. **Add Feedback** - Capture improvements, bugs, or ideas for each project
4. **Prioritize** - Assign priority levels (Critical → Nice to Have)
5. **Launch Claude** - Open Claude Code with context about pending feedback
6. **Track Progress** - Mark items as complete when implemented

## Documentation

See the `docs/` folder for detailed design specifications:

- `app_idea_vibe_hub.md` - Original concept and problem statement
- `design_spec_mvp.md` - MVP feature specifications
- `technical_spec.md` - Technical architecture and data models
- `mvp_feedback.md` - Implementation feedback and improvements

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand
- **Backend**: Rust, Tauri 2.x
- **Build Tool**: Vite
- **Testing**: Vitest (frontend), Cargo test (backend)

## Development Tips

- Use `CLAUDE.md` for detailed development guidance
- Run tests with `npm test` (frontend) or `cd src-tauri && cargo test` (Rust)
- Hot reload works for both frontend and Rust code changes
- Check `docs/technical_spec.md` for architecture details

## License

MIT
