import type { FeedbackItem } from '../store/types';
import { PRIORITY_LABELS } from '../store/types';

/**
 * Generate a Claude Code prompt from feedback items
 *
 * NOTE: This prompt is also documented in prompts.md at the project root.
 * You can edit prompts.md to customize the feedback workflow prompt.
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

  const footer = `\n\nPlease follow this workflow to fix these items:

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

This ensures every change is tested and verified before being pushed to the repository.`;


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
