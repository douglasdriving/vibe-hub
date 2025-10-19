/**
 * Prompt generation utilities for the project pipeline stages
 */

export function generateIdeaRefinementPrompt(projectName: string, projectPath: string): string {
  return `I have an initial idea for a project called: ${projectName}

**Instructions:**

1. **Read the project idea** - First, please read the idea.md file in the .vibe folder at:
   ${projectPath}/.vibe/idea.md

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

Please start by reading the idea.md file and then web searching for existing alternatives!`;
}

export function generateDesignSpecPrompt(projectName: string, projectPath: string): string {
  return `I need help generating an MVP design specification for my project: ${projectName}

**Instructions:**

1. **Read the project idea** - First, please read the idea.md file in the .vibe folder at:
   ${projectPath}/.vibe/idea.md

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
   ${projectPath}/.vibe/design-spec.md

7. **Iterate** - We'll iterate on the design spec until I approve it. Feel free to suggest improvements or alternatives for HOW to implement the idea, but not WHETHER to implement it.

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

export function generateMetadataPrompt(projectName: string, projectPath: string): string {
  return `I need help filling out the project metadata for: ${projectName}

**Instructions:**

1. **Read all specification documents** - Please scan these files to understand the project:
   - ${projectPath}/.vibe/idea.md (project concept)
   - ${projectPath}/.vibe/design-spec.md (MVP features)
   - ${projectPath}/.vibe/technical-spec.md (architecture and tech stack)

2. **Fill out metadata.md** - Please update the metadata file at ${projectPath}/.vibe/metadata.md with:
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

Please read the specs and update the metadata file!`;
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

export function generateTechnicalTestPrompt(projectName: string, projectPath: string): string {
  return `I need help creating a comprehensive test checklist for my project: ${projectName}

**Instructions:**

1. **Read all specification and implementation files** - Please scan:
   - ${projectPath}/.vibe/design-spec.md (to understand features)
   - ${projectPath}/.vibe/technical-spec.md (to understand architecture)
   - The actual source code (to see what was implemented)

2. **Create test checklist** - Generate a test-checklist.md file at:
   ${projectPath}/.vibe/test-checklist.md

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

Please create the comprehensive test checklist now!`;
}

export function generateDesignTestPrompt(projectName: string, projectPath: string): string {
  return `I need to review the design and UX of my MVP for: ${projectName}

**Instructions:**

1. **Read the design specification** - First, review what was intended:
   ${projectPath}/.vibe/design-spec.md

2. **Review the feedback document** - I've documented my design feedback at:
   ${projectPath}/.vibe/design-feedback.md

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

Please read my design feedback and let's start addressing the issues one by one!`;
}

export function generateDeploymentPrompt(projectName: string, projectPath: string): string {
  return `I'm ready to deploy my project: ${projectName}

**Instructions:**

1. **Read the technical specification** - Review deployment requirements:
   ${projectPath}/.vibe/technical-spec.md

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

Please help me choose a hosting platform and guide me through the deployment process!`;
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
        actionLabel: 'Refine Idea with Claude',
        promptGenerator: generateIdeaRefinementPrompt,
      };

    case 'designed':
      return {
        nextStatus: 'tech-spec-ready',
        actionLabel: 'Generate Design Spec with Claude',
        promptGenerator: generateDesignSpecPrompt,
      };

    case 'tech-spec-ready':
      return {
        nextStatus: 'metadata-ready',
        actionLabel: 'Generate Tech Spec with Claude',
        promptGenerator: generateTechnicalSpecPrompt,
      };

    case 'metadata-ready':
      return {
        nextStatus: 'mvp-implemented',
        actionLabel: 'Fill Project Metadata with Claude',
        promptGenerator: generateMetadataPrompt,
      };

    case 'mvp-implemented':
      return {
        nextStatus: 'technical-testing',
        actionLabel: 'Start Implementation with Claude',
        promptGenerator: generateImplementationPrompt,
      };

    case 'technical-testing':
      return {
        nextStatus: 'design-testing',
        actionLabel: 'Create Test Checklist with Claude',
        promptGenerator: generateTechnicalTestPrompt,
      };

    case 'design-testing':
      return {
        nextStatus: 'deployment',
        actionLabel: 'Review Design & UX with Claude',
        promptGenerator: generateDesignTestPrompt,
      };

    case 'deployment':
      return {
        nextStatus: 'deployed',
        actionLabel: 'Mark as Deployed',
        promptGenerator: generateDeploymentPrompt,
      };

    case 'deployed':
      // Final status - no next stage
      return null;

    default:
      return null;
  }
}

/**
 * Check if a status is in the project setup pipeline
 */
export function isSetupStatus(status: string): boolean {
  return ['initialized', 'idea', 'designed', 'tech-spec-ready', 'metadata-ready', 'mvp-implemented', 'technical-testing', 'design-testing', 'deployment'].includes(status);
}

/**
 * Get user-friendly description for each setup stage
 */
export function getStageDescription(status: string): string {
  switch (status) {
    case 'initialized':
      return 'Write a clear project pitch describing what you want to build and why.';

    case 'idea':
      return 'Refine your idea with Claude - research alternatives, validate the approach, and finalize the concept.';

    case 'designed':
      return 'Work with Claude to design the MVP scope, user flows, and core features.';

    case 'tech-spec-ready':
      return 'Generate a technical specification with Claude to plan the architecture and tech stack.';

    case 'metadata-ready':
      return 'Have Claude fill out the project metadata based on your specifications.';

    case 'mvp-implemented':
      return 'Start implementing the MVP with Claude using the design and technical specs.';

    case 'technical-testing':
      return 'Test all functionality with Claude\'s test checklist and fix bugs until everything works.';

    case 'design-testing':
      return 'Review the design and UX - document feedback and work with Claude to refine the MVP.';

    case 'deployment':
      return 'Deploy your app to production with Claude\'s guidance and verify it works live.';

    default:
      return '';
  }
}

/**
 * Get the name/title for each stage
 */
export function getStageName(status: string): string {
  switch (status) {
    case 'initialized':
      return 'Project Initialization';

    case 'idea':
      return 'Idea Refinement';

    case 'designed':
      return 'Design Specification';

    case 'tech-spec-ready':
      return 'Technical Specification';

    case 'metadata-ready':
      return 'Project Metadata';

    case 'mvp-implemented':
      return 'MVP Implementation';

    case 'technical-testing':
      return 'Technical Testing';

    case 'design-testing':
      return 'Design & UX Review';

    case 'deployment':
      return 'Deployment';

    case 'deployed':
      return 'Deployed';

    default:
      return 'Project Setup';
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
      return '🔍';

    case 'designed':
      return '📐';

    case 'tech-spec-ready':
      return '🔧';

    case 'metadata-ready':
      return '📝';

    case 'mvp-implemented':
      return '⚡';

    case 'technical-testing':
      return '🧪';

    case 'design-testing':
      return '🎨';

    case 'deployment':
      return '🚀';

    case 'deployed':
      return '✅';

    default:
      return '📋';
  }
}
