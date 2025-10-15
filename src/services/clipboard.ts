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

  const footer = '\n\nPlease review these items and suggest how to approach them.';

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
