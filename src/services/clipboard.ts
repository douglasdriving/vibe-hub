import * as tauri from './tauri';

/**
 * Generate a Claude Code prompt for refining raw feedback
 */
export async function generateFeedbackRefinementPrompt(
  projectName: string,
  projectPath: string
): Promise<string> {
  return await tauri.getPrompt('feedbackRefinement', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

/**
 * Generate a Claude Code prompt for implementing refined issues
 */
export async function generateIssueFixPrompt(
  projectName: string,
  projectPath: string
): Promise<string> {
  return await tauri.getPrompt('issueFix', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

/**
 * Generate a Claude Code prompt for automated workflow (refine + fix)
 */
export async function generateAutomatedWorkflowPrompt(
  projectName: string,
  projectPath: string
): Promise<string> {
  return await tauri.getPrompt('automatedWorkflow', {
    PROJECT_NAME: projectName,
    PROJECT_PATH: projectPath
  });
}

/**
 * Copy text to clipboard using the Clipboard API
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    throw new Error('Failed to copy to clipboard');
  }
}
