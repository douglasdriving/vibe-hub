import type { FeedbackItem } from '../store/types';
import { PRIORITY_LABELS } from '../store/types';

/**
 * Generate a Claude Code prompt from feedback items
 */
export function generateClaudePrompt(
  projectName: string,
  feedbackItems: FeedbackItem[]
): string {
  const header = `I need help with the following feedback items for ${projectName}:\n\n`;

  const items = feedbackItems
    .map((item, index) =>
      `${index + 1}. [${PRIORITY_LABELS[item.priority]}] ${item.text}`
    )
    .join('\n');

  const footer = '\n\nPlease review these items one by one. For each item, write down one or several todos that you need to do in order to fix it. Then, in case you have clarification that you need, please ask me for them. If you dont need clarifications, or if I have given them to you, then start implementing all the todos. For each thing you implement, commit with a very short message about what you changed to git. After all changes have been made, run through all the test that you can yourself (such as attempting a build), and fix any errors that might have occured. When all that is done, let me know so that I can test the app with your changes.';

  return header + items + footer;
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
