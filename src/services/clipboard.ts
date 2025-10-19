import type { FeedbackItem } from '../store/types';
import * as tauri from './tauri';

/**
 * Generate a Claude Code prompt for feedback workflow
 *
 * Loads the prompt template from prompts.json at the project root.
 * The prompt references the feedback.json file directly instead of
 * embedding all feedback items in the prompt text.
 *
 * Edit prompts.json to customize the feedback workflow prompt.
 */
export async function generateClaudePrompt(
  projectName: string,
  projectPath: string,
  _feedbackItems?: FeedbackItem[] // Kept for backwards compatibility but not used
): Promise<string> {
  // Load prompt from prompts.json
  // The prompt will instruct Claude to read feedback.json directly
  return await tauri.getPrompt('feedbackWorkflow', {
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
    console.error('Failed to copy to clipboard:', error);
    throw new Error('Failed to copy to clipboard');
  }
}
