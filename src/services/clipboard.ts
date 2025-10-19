import type { FeedbackItem } from '../store/types';
import { PRIORITY_LABELS } from '../store/types';
import * as tauri from './tauri';

/**
 * Generate a Claude Code prompt from feedback items
 *
 * Loads the prompt template from prompts.json at the project root.
 * Edit that file to customize the feedback workflow prompt.
 */
export async function generateClaudePrompt(
  projectName: string,
  feedbackItems: FeedbackItem[]
): Promise<string> {
  // Format feedback items
  const items = feedbackItems
    .map((item, index) =>
      `${index + 1}. [${PRIORITY_LABELS[item.priority]}] ${item.text}`
    )
    .join('\n');

  // Load prompt from prompts.json
  return await tauri.getPrompt('feedbackWorkflow', {
    PROJECT_NAME: projectName,
    FEEDBACK_ITEMS: items
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
