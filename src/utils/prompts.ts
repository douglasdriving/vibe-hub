/**
 * Prompt generation utilities for the project pipeline stages
 *
 * All prompts are loaded from prompts.json at the project root.
 * Edit that file to customize how Claude assists with your projects.
 */

import * as tauri from '../services/tauri';

export async function generateIdeaRefinementPrompt(projectName: string, projectPath: string): Promise<string> {
  return await tauri.getPrompt('ideaRefinement', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

export async function generateDesignSpecPrompt(projectName: string, projectPath: string): Promise<string> {
  return await tauri.getPrompt('designSpec', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

export async function generateTechnicalSpecPrompt(projectName: string, projectPath: string): Promise<string> {
  return await tauri.getPrompt('technicalSpec', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

export async function generateMetadataPrompt(projectName: string, projectPath: string): Promise<string> {
  return await tauri.getPrompt('metadata', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

export async function generateImplementationPrompt(projectName: string, projectPath: string): Promise<string> {
  return await tauri.getPrompt('implementation', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

export async function generateTechnicalTestPrompt(projectName: string, projectPath: string): Promise<string> {
  return await tauri.getPrompt('technicalTesting', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

export async function generateDesignTestPrompt(projectName: string, projectPath: string): Promise<string> {
  return await tauri.getPrompt('designTesting', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

export async function generateDeploymentPrompt(projectName: string, projectPath: string): Promise<string> {
  return await tauri.getPrompt('deployment', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

/**
 * Generate a prompt for advancing to the next stage
 * This is used when a stage is completed and the project is ready to move forward
 */
export function getStageAdvancementInfo(currentStatus: string): {
  nextStatus: string;
  actionLabel: string;
  promptGenerator: (projectName: string, projectPath: string) => Promise<string>;
} | null {
  switch (currentStatus) {
    case 'initialized':
      return {
        nextStatus: 'idea',
        actionLabel: 'Write Project Pitch',
        promptGenerator: async () => '', // Uses IdeaEditorModal instead
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
