/**
 * Prompt generation utilities for the project pipeline stages
 */

export function generateDesignSpecPrompt(projectName: string, projectPath: string): string {
  return `I need help generating an MVP design specification for my project: ${projectName}

**Instructions:**

1. **Read the project idea** - First, please read the idea.md file in the .vibe folder at:
   ${projectPath}/.vibe/idea.md

2. **Ask clarifying questions** - Based on the idea, ask me clarifying questions about:
   - User interface and user experience design choices
   - Core user flows and interactions
   - Feature prioritization (what's MVP vs future)
   - Platform-specific considerations
   - Any ambiguities in the requirements

3. **Propose MVP scope** - After I answer your questions, propose what should be:
   - ✅ In scope for MVP (core features that must be included)
   - ❌ Out of scope for MVP (features to defer to later phases)

4. **Generate design-spec.md** - Once we agree on scope, create a comprehensive design specification with:
   - **Core Features**: Detailed description of each MVP feature
   - **User Flows**: Step-by-step user interactions for key workflows
   - **Design Decisions**: Key UI/UX decisions and rationale
   - **Out of Scope**: Features explicitly deferred to post-MVP

5. **Write the file** - Save the design spec to:
   ${projectPath}/.vibe/design-spec.md

6. **Iterate** - We'll iterate on the design spec until I approve it. Feel free to suggest improvements or alternatives.

Please start by reading the idea.md file and asking your first set of clarifying questions!`;
}

export function generateTechnicalSpecPrompt(projectName: string, projectPath: string): string {
  return `I need help generating a technical specification for my project: ${projectName}

**Instructions:**

1. **Read the design spec** - First, please read the design-spec.md file in the .vibe folder at:
   ${projectPath}/.vibe/design-spec.md

   Also read the idea.md for additional context:
   ${projectPath}/.vibe/idea.md

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
   ${projectPath}/.vibe/technical-spec.md

Please start by reading the design spec and proposing your initial technical architecture!`;
}

export function generateImplementationPrompt(projectName: string, projectPath: string): string {
  return `I'm ready to start implementing the MVP for my project: ${projectName}

**Instructions:**

1. **Read all specification documents** - Please read these files to understand the full context:
   - ${projectPath}/.vibe/idea.md (project concept)
   - ${projectPath}/.vibe/design-spec.md (MVP features and user flows)
   - ${projectPath}/.vibe/technical-spec.md (architecture and tech stack)

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

Please start by reading the spec files and proposing your implementation plan!`;
}

/**
 * Generate a prompt for advancing to the next stage
 * This is used when a stage is completed and the project is ready to move forward
 */
export function getStageAdvancementInfo(currentStatus: string): {
  nextStatus: string;
  actionLabel: string;
  promptGenerator: (projectName: string, projectPath: string) => string;
} | null {
  switch (currentStatus) {
    case 'initialized':
      return {
        nextStatus: 'idea',
        actionLabel: 'Write Project Pitch',
        promptGenerator: () => '', // Uses IdeaEditorModal instead
      };

    case 'idea':
      return {
        nextStatus: 'designed',
        actionLabel: 'Generate Design Spec with Claude',
        promptGenerator: generateDesignSpecPrompt,
      };

    case 'designed':
      return {
        nextStatus: 'tech-spec-ready',
        actionLabel: 'Generate Tech Spec with Claude',
        promptGenerator: generateTechnicalSpecPrompt,
      };

    case 'tech-spec-ready':
      return {
        nextStatus: 'mvp-implemented',
        actionLabel: 'Start Implementation with Claude',
        promptGenerator: generateImplementationPrompt,
      };

    case 'mvp-implemented':
    case 'in-progress':
    case 'deployed':
      // These statuses don't have a "next stage" in the pipeline
      return null;

    default:
      return null;
  }
}

/**
 * Check if a status is in the project setup pipeline
 */
export function isSetupStatus(status: string): boolean {
  return ['initialized', 'idea', 'designed', 'tech-spec-ready'].includes(status);
}

/**
 * Get user-friendly description for each setup stage
 */
export function getStageDescription(status: string): string {
  switch (status) {
    case 'initialized':
      return 'Write a clear project pitch describing what you want to build and why.';

    case 'idea':
      return 'Work with Claude to design the MVP scope, user flows, and core features.';

    case 'designed':
      return 'Generate a technical specification with Claude to plan the architecture and tech stack.';

    case 'tech-spec-ready':
      return 'Start implementing the MVP with Claude using the design and technical specs.';

    default:
      return '';
  }
}

/**
 * Get the icon/emoji for each stage
 */
export function getStageIcon(status: string): string {
  switch (status) {
    case 'initialized':
      return '💡';

    case 'idea':
      return '📐';

    case 'designed':
      return '🔧';

    case 'tech-spec-ready':
      return '⚡';

    case 'mvp-implemented':
      return '✅';

    case 'in-progress':
      return '🚧';

    case 'deployed':
      return '🚀';

    default:
      return '📋';
  }
}
