# Vibe Hub - Design Clarifications

## Core Scope

### What is the MVP?
Which features are must-haves for the first version?

**Your answer:**
- A local overview of your vibe-projects, with listed feedback for each project.

### What is this app NOT trying to be?
(e.g., not a code editor, not a full IDE, not a team collaboration tool)

**Your answer:**
not a code editor, not an idea, not a team collab tool

---

## Project Management

### How are projects discovered?
(Auto-scan a folder? Manual import? Both?)

**Your answer:**
i am thinking a directory, where each sub-folder is a project.

### What defines a project?
(Any git repo? Specific file patterns? User designates?)

**Your answer:**
there should be a git repo for this project yes, and there should be separate repos for each of the vibe coded projects

### What metadata should be tracked per project?
(Tech stack, last modified, deployment URL, description, etc.)

**Your answer:**
you decide

---

## Design Information

### What "design" information needs to be stored?
(Screenshots? Mockups? Text descriptions? Links to Figma?)

**Your answer:**
for now, just text. for the future, some visual material as well, but can ignore this for now. lets work in markdown

### How is this design info captured/updated?
(Manual entry? Screenshots uploaded? Scraped from files?)

**Your answer:**
manual entry
can also be loaded in from the various project folders, where they should have markdown docs describing themselves.

---

## Feedback System

### Where should feedback be stored initially?
you decide what you think is best technically. as long as it is local first!

### What should a feedback item contain?
text, prio level

### How should priority ranking work?
scale from 1-5, with explanations for each point (severe -> unimportant)

### Should we defer the "in-app feedback submission API" for later?
yes, we can start by just making a local overview with a local feedback tracking for each project.

---

## Claude Integration

### What does "opening Claude" mean?
- [ ] Launch Claude Code CLI in the project directory
- [ ] Open browser to Claude.ai with a pre-filled prompt
- [ ] Deeper API integration
- [ ] Other: ___________

**Your choice:**
Launch Claude Code CLI in the project directory

### Should the app just launch Claude with a copied prompt, or track what Claude has done?

**Your answer:**
For now it can just open claude with a copied prompt. But in the future it might be good if it can be aware and directly feed prompts in with buttons.

---

## Technical Decisions

### Desktop framework preference?
- [ ] Electron (familiar web tech, heavy)
- [ ] Tauri (web tech, lighter, more modern)
- [ ] Flutter (cross-platform, different paradigm)
- [ ] Native (C#/WPF for Windows)
- [ ] Haven't decided

**Your choice:**
Tauri sounds nice, but I honestly leave any tech decision up to you.

### Local-first sync approach?
If you eventually need cloud sync, what approach:
- [ ] Git-based (commit feedback files to repos)
- [ ] Simple cloud storage (Supabase, Firebase)
- [ ] File sync service (Dropbox-style)
- [ ] Not needed yet

**Your answer:**
you decide the technical approach

---

## Key Critique to Address

**Scope concern:** The original idea combines a project dashboard, feedback infrastructure, cloud sync, and AI integration. This is a lot for one app.

### Do you agree with a phased approach?
Phase 1: Local dashboard + manual feedback
Phase 2: Add cloud sync
Phase 3: Add deeper Claude integration

**Your response:**
Yes. I would add that for the feedback, there has to be a smart way for claude to be aware of the feedback progress for a specific project when it works on it. So like - perhaps it is good if the feedback tracking for each project happens INSIDE that project folder? Alternatively, the feedback tracking itself happens outside, but the system feeds the feedback into claud via prompts. you can also decide what approach is best here.

---

## Next Steps

Once you fill this out, we can create a proper design spec.
