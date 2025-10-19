# Vibe Hub - Claude Prompts

This file contains all the prompts that Vibe Hub uses when interacting with Claude Code. You can edit these prompts to customize how Claude assists with your projects.

---

## Feedback Workflow Prompt

**Used when**: Copying feedback items to Claude for implementation

```
I need help with the following feedback items for {PROJECT_NAME}:

{FEEDBACK_ITEMS}

Please follow this workflow to fix these items:

1. **Create an Implementation Plan**: Review all feedback items and create a structured plan that:
   - Identifies which issues are related or dependent on each other
   - Groups related issues that should be fixed together in the same "fix"
   - Orders fixes by dependency (fix issues that others depend on first)
   - Numbers each fix in the plan

2. **Work Through Fixes One-by-One**: For each fix in your plan:
   - Explain what you're about to implement
   - Ask for any clarifications you need before starting
   - Implement the fix
   - Run all tests you can yourself (build, type-check, etc.)
   - Create a test checklist for me to verify the changes work correctly
   - Commit with a short message describing the change
   - **WAIT for me to test and confirm it works before moving to the next fix**

3. **Do NOT push code** until I have tested and confirmed each fix works as intended.

4. **After I confirm a fix works**, push that commit and move on to the next fix in your plan.

This ensures every change is tested and verified before being pushed to the repository.
```

---

## Idea Refinement Prompt

**Used when**: Moving from "initialized" to "idea" status

```
I have an initial idea for a project called: {PROJECT_NAME}

**Instructions:**

1. **Read the project idea** - First, please read the idea.md file in the .vibe folder at:
   {PROJECT_PATH}/.vibe/idea.md

2. **Research existing alternatives** - Before we proceed, please web search for:
   - Existing apps/projects that solve the same or similar problems
   - Open source projects that might already do what I'm trying to build
   - Commercial products in this space

   For each alternative you find, briefly describe:
   - What it does and how it compares to my idea
   - Whether it's open source (and if so, if it could be forked/extended)
   - Key differences from my proposed approach

3. **Question the approach** - Based on the problem described in idea.md:
   - Is there a simpler or more straightforward way to solve this problem?
   - Are there alternative approaches I should consider?
   - What are the trade-offs of my proposed approach vs alternatives?

4. **Iterate on the idea** - Based on your research and analysis:
   - Ask clarifying questions about unclear aspects
   - Suggest improvements to the core concept
   - Help me refine the idea to ensure it's worth building
   - Point out any potential issues or challenges

5. **Finalize the idea** - Once we've discussed alternatives and refined the concept:
   - Update the idea.md file with our refined thinking
   - Make sure it clearly articulates the problem, solution, and why this approach makes sense

**Important**: The goal here is to make sure we're building something worthwhile. Be critical and honest about whether this idea makes sense, or if there are better alternatives (including not building it at all).

Please start by reading the idea.md file and then web searching for existing alternatives!
```

---

## Design Spec Prompt

**Used when**: Moving from "idea" to "designed" status

```
I need help generating an MVP design specification for my project: {PROJECT_NAME}

**Instructions:**

1. **Read the project idea** - First, please read the idea.md file in the .vibe folder at:
   {PROJECT_PATH}/.vibe/idea.md

2. **Take the idea as given** - The core idea has already been validated and refined in the previous stage. Do NOT question or critique the fundamental concept. Instead, focus on how to design and scope the MVP implementation.

3. **Ask clarifying questions** - Based on the idea, ask me clarifying questions about:
   - User interface and user experience design choices
   - Core user flows and interactions
   - Feature prioritization (what's MVP vs future)
   - Platform-specific considerations
   - Any ambiguities in the requirements

4. **Propose MVP scope** - After I answer your questions, propose what should be:
   - ✅ In scope for MVP (core features that must be included)
   - ❌ Out of scope for MVP (features to defer to later phases)

5. **Generate design-spec.md** - Once we agree on scope, create a comprehensive design specification with:
   - **Core Features**: Detailed description of each MVP feature
   - **User Flows**: Step-by-step user interactions for key workflows
   - **Design Decisions**: Key UI/UX decisions and rationale
   - **Out of Scope**: Features explicitly deferred to post-MVP

6. **Write the file** - Save the design spec to:
   {PROJECT_PATH}/.vibe/design-spec.md

7. **Iterate** - We'll iterate on the design spec until I approve it. Feel free to suggest improvements or alternatives for HOW to implement the idea, but not WHETHER to implement it.

Please start by reading the idea.md file and asking your first set of clarifying questions!
```

---

## Technical Spec Prompt

**Used when**: Moving from "designed" to "tech-spec-ready" status

```
I need help generating a technical specification for my project: {PROJECT_NAME}

**Instructions:**

1. **Read the design spec** - First, please read the design-spec.md file in the .vibe folder at:
   {PROJECT_PATH}/.vibe/design-spec.md

   Also read the idea.md for additional context:
   {PROJECT_PATH}/.vibe/idea.md

2. **Propose technical architecture** - Based on the design spec, propose:
   - **Tech Stack**: Specific technologies, frameworks, and libraries to use
   - **Architecture**: Overall system architecture (client-server, local-first, etc.)
   - **Data Models**: Key data structures and their relationships
   - **File Structure**: Recommended project organization
   - **Key Technical Decisions**: Important technical choices and trade-offs

3. **Explain your choices** - For each major technology choice, briefly explain:
   - Why this technology is a good fit for the project
   - What alternatives were considered
   - Any important trade-offs or limitations

4. **Generate technical-spec.md** - Create a comprehensive technical specification with:
   - **Architecture Overview**: High-level system architecture
   - **Tech Stack**: Complete list of technologies with justification
   - **Data Models**: Detailed data structures and schemas
   - **File/Project Structure**: How code should be organized
   - **Key Technical Decisions**: Important technical choices with rationale
   - **Development Setup**: How to set up the development environment

5. **Write the file** - Save the technical spec to:
   {PROJECT_PATH}/.vibe/technical-spec.md

Please start by reading the design spec and proposing your initial technical architecture!
```

---

## Metadata Prompt

**Used when**: Moving from "tech-spec-ready" to "metadata-ready" status

```
I need help filling out the project metadata for: {PROJECT_NAME}

**Instructions:**

1. **Read all specification documents** - Please scan these files to understand the project:
   - {PROJECT_PATH}/.vibe/idea.md (project concept)
   - {PROJECT_PATH}/.vibe/design-spec.md (MVP features)
   - {PROJECT_PATH}/.vibe/technical-spec.md (architecture and tech stack)

2. **Fill out metadata.md** - Please update the metadata file at {PROJECT_PATH}/.vibe/metadata.md with:
   - **Name**: A nice human-readable project name (not just the folder name)
   - **Status**: Keep as "metadata-ready" for now
   - **Platform**: Specify the target platform(s) - e.g., "Web", "Desktop", "Tauri Desktop App", "Mobile", etc.
   - **Description**: A clear 1-2 sentence description of what this project does
   - **Tech Stack**: List the main technologies from the technical spec
   - **Deployment**: Leave empty for now (will be filled after deployment)

3. **Format requirements**:
   - Keep the existing Name, Status, Platform, and Color lines at the top
   - Update the Platform field based on the technical spec (e.g., if it's a Tauri app, write "Tauri Desktop App")
   - Update the Description section with your summary
   - List technologies as bullet points under Tech Stack
   - Keep the markdown structure intact

Please read the specs and update the metadata file!
```

---

## Implementation Prompt

**Used when**: Moving from "metadata-ready" to "mvp-implemented" status

```
I'm ready to start implementing the MVP for my project: {PROJECT_NAME}

**Instructions:**

1. **Read all specification documents** - Please read these files to understand the full context:
   - {PROJECT_PATH}/.vibe/idea.md (project concept)
   - {PROJECT_PATH}/.vibe/design-spec.md (MVP features and user flows)
   - {PROJECT_PATH}/.vibe/technical-spec.md (architecture and tech stack)

2. **Create implementation plan** - Based on the specs, create a plan that:
   - Breaks down the MVP into logical implementation phases
   - Identifies dependencies between features
   - Suggests an order of implementation that allows for incremental testing
   - Estimates rough complexity for each phase

3. **Start implementation** - Begin implementing the MVP incrementally:
   - Set up the initial project structure based on technical spec
   - Implement core features one at a time
   - Test each feature as you build it
   - Keep me updated on progress

4. **Follow best practices**:
   - Write clean, maintainable code with clear comments
   - Follow the architecture defined in technical-spec.md
   - Implement only MVP features (defer out-of-scope items)
   - Add proper error handling
   - Test thoroughly as you go

5. **Iterate and adjust** - As we implement:
   - Flag any technical issues or blockers
   - Suggest improvements if you see better approaches
   - Ask for clarification when specs are ambiguous
   - Keep the implementation focused on MVP scope

**Important**: This is an MVP, so:
- Prioritize core functionality over polish
- Avoid premature optimization
- Skip features marked as "out of scope" in design-spec.md
- Focus on getting a working prototype that demonstrates value

Please start by reading the spec files and proposing your implementation plan!
```

---

## Technical Testing Prompt

**Used when**: Moving from "mvp-implemented" to "technical-testing" status

```
I need help creating a comprehensive test checklist for my project: {PROJECT_NAME}

**Instructions:**

1. **Read all specification and implementation files** - Please scan:
   - {PROJECT_PATH}/.vibe/design-spec.md (to understand features)
   - {PROJECT_PATH}/.vibe/technical-spec.md (to understand architecture)
   - The actual source code (to see what was implemented)

2. **Create test checklist** - Generate a test-checklist.md file at:
   {PROJECT_PATH}/.vibe/test-checklist.md

The checklist should include:

**For each feature/functionality**:
- [ ] Feature name or description
  - What to test: Step-by-step testing instructions
  - Expected behavior: What should happen
  - Test outcome: [Leave blank for user to fill in - PASS/FAIL and comments]
  - Notes: [Leave blank for user to add feedback]

3. **Cover all testable areas**:
   - All UI components and interactions
   - All user flows from design-spec.md
   - Edge cases and error handling
   - Cross-browser/platform compatibility (if applicable)
   - Data persistence and state management
   - Any integrations or external dependencies

4. **Format for manual testing**:
   - Write clear, specific test steps anyone can follow
   - Include test data or inputs to use
   - Organize tests logically (by feature or user flow)
   - Make it easy to track pass/fail status

5. **Include instructions** - At the top of the file, explain:
   - How to use this checklist
   - What to write in "Test outcome" (PASS/FAIL + comments)
   - That we'll iterate on fixes until all tests pass

Please create the comprehensive test checklist now!
```

---

## Design Testing Prompt

**Used when**: Moving from "technical-testing" to "design-testing" status

```
I need to review the design and UX of my MVP for: {PROJECT_NAME}

**Instructions:**

1. **Read the design specification** - First, review what was intended:
   {PROJECT_PATH}/.vibe/design-spec.md

2. **Review the feedback document** - I've documented my design feedback at:
   {PROJECT_PATH}/.vibe/design-feedback.md

3. **Analyze and fix issues** - Based on my feedback:
   - Address each piece of feedback iteratively
   - Ask clarifying questions if feedback is unclear
   - Suggest design improvements
   - Implement fixes for design issues
   - Remove features I marked for removal
   - Refine UI/UX based on my notes

4. **Iterate until satisfied** - We'll work through all feedback items together until:
   - All critical design issues are resolved
   - The MVP matches my vision
   - UI/UX feels right and usable
   - Any unwanted features are removed

Please read my design feedback and let's start addressing the issues one by one!
```

---

## Deployment Prompt

**Used when**: Moving from "design-testing" to "deployment" status

```
I'm ready to deploy my project: {PROJECT_NAME}

**Instructions:**

1. **Read the technical specification** - Review deployment requirements:
   {PROJECT_PATH}/.vibe/technical-spec.md

2. **Guide me through deployment** - Help me with step-by-step deployment:
   - Choose appropriate hosting platform based on the tech stack
   - Set up hosting account and configure deployment
   - Configure environment variables and secrets
   - Set up CI/CD if needed
   - Deploy the application
   - Verify the deployment works correctly

3. **Test the live deployment** - Once deployed:
   - Test all core functionality in production
   - Check for any environment-specific issues
   - Verify data persistence works
   - Test performance and loading times
   - Confirm all features work as expected

4. **Document the deployment** - After successful deployment:
   - Note the live URL
   - Document deployment process for future updates
   - Add deployment URL to metadata

5. **Troubleshoot issues** - If anything doesn't work:
   - Debug deployment errors together
   - Fix configuration issues
   - Ensure production environment matches dev expectations

Please help me choose a hosting platform and guide me through the deployment process!
```

---

## Generate Metadata Prompt (for existing projects)

**Used when**: Scanning an existing project and generating metadata

```
Please analyze this project and fill out the .vibe/metadata.md file with accurate information.

Project: {PROJECT_NAME}

Instructions:
1. Scan key files in the project (package.json, README.md, source files, etc.)
2. Come up with a nice display name for the project (not just the folder name)
3. Determine the project status (draft/mvp-implemented/deployed)
4. Identify the target platform (e.g., Web, Desktop, Tauri Desktop App, Mobile, etc.)
5. Identify the project's purpose and write a clear description
6. List all major technologies in the tech stack
7. Look for deployment configuration or URLs if present

The .vibe/metadata.md file should have this format:

Name: [A nice human-readable project name]
Status: [draft OR mvp-implemented OR deployed]
Platform: [e.g., Web, Desktop, Tauri Desktop App, Mobile, etc.]

## Description

[Write a 1-2 sentence description of what this project does]

## Tech Stack

- [Technology 1]
- [Technology 2]
- [Technology 3]

## Deployment

[Add deployment URL if found, otherwise remove this section]

Please update the .vibe/metadata.md file now with accurate information based on your analysis of the codebase.
```

---

## Notes

- Placeholders like `{PROJECT_NAME}` and `{PROJECT_PATH}` are automatically replaced by the app
- `{FEEDBACK_ITEMS}` is replaced with the formatted list of feedback items
- Feel free to customize these prompts to match your workflow and preferences!
