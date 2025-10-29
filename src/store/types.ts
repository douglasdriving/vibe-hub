// Project Model
export interface Project {
  id: string;                    // UUID
  name: string;                  // From folder name
  displayName?: string;          // Nice name from metadata
  path: string;                  // Absolute path
  description: string;           // From vibe-hub.json or manual
  platform?: string;             // Windows/macOS/Linux/Web/Mobile/Cross-platform
  isLocalFirst?: boolean;        // Is local-first architecture
  isOpenSource?: boolean;        // Is open source
  hasBackend?: boolean;          // Has backend server
  deploymentUrl?: string;        // Optional
  status: 'initialized' | 'idea' | 'designed' | 'tech-spec-ready' | 'metadata-ready' | 'mvp-implemented' | 'technical-testing' | 'design-testing' | 'deployment' | 'deployed'; // Project status
  color?: string;                // Project color for UI (synth-wave palette)
  textColor?: string;            // Text color for contrast with background (#000000 or #FFFFFF)
  iconPath?: string;             // Custom project icon path (relative to project root)
  lastModified?: string;         // From git or filesystem (ISO 8601)
  feedbackCount: number;         // Calculated
  highestFeedbackPriority?: 1 | 2 | 3 | 4 | 5; // Highest priority of pending feedback (1 is highest)
  hasUncommittedChanges: boolean; // Git status
  hasGitRepo: boolean;           // Whether project has .git directory
}

// Feedback Item Model
export interface FeedbackItem {
  id: string;                    // UUID
  text: string;                  // Feedback content
  priority: 1 | 2 | 3 | 4 | 5;  // Priority level
  status: 'pending' | 'needs-review' | 'refined' | 'completed';
  createdAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp
  refinedIntoIssueIds?: string[]; // IDs of issues this feedback was refined into
  reviewNotes?: string;          // Questions/clarifications needed for review
  relatedIssueId?: string;       // ID of the issue this bug report is related to
}

// Issue Model (refined feedback ready for implementation)
export interface Issue {
  id: string;                    // UUID
  originalFeedbackId?: string;   // ID of the raw feedback this was refined from
  title: string;                 // Short summary
  description: string;           // Detailed description
  subtasks: string[];            // List of subtasks
  timeEstimate?: string;         // Estimated time (DEPRECATED - kept for backwards compatibility)
  complexity: 1 | 2 | 3 | 4 | 5; // Complexity rating (1=Trivial, 2=Simple, 3=Moderate, 4=Complex, 5=Very Complex)
  priority: 1 | 2 | 3 | 4 | 5;  // Priority level
  status: 'pending' | 'in-progress' | 'for-review' | 'completed';
  createdAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp
  reviewNotes?: string;          // Bug reports or notes from testing/review
}

// Settings
export interface Settings {
  projectsDirectory: string;
  soundEffectsEnabled: boolean;
  launchOnStartup: boolean;
  autoRefineOnStartup: boolean;
}

// Priority Labels
export const PRIORITY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Critical',
  2: 'High Priority',
  3: 'Medium',
  4: 'Low Priority',
  5: 'Nice to Have',
};

// Priority Descriptions
export const PRIORITY_DESCRIPTIONS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Completely game breaking bug or game changing feature',
  2: 'Important issue that significantly impacts functionality',
  3: 'Moderate improvement or fix that enhances the experience',
  4: 'Minor enhancement or polish that can wait',
  5: 'Optional nice-to-have feature for future consideration',
};

// Priority Colors (Tailwind classes)
export const PRIORITY_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
  5: 'bg-gray-500',
};

// Complexity Labels
export const COMPLEXITY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Trivial',
  2: 'Simple',
  3: 'Moderate',
  4: 'Complex',
  5: 'Very Complex',
};

// Complexity Colors (Tailwind classes)
export const COMPLEXITY_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'bg-green-500',
  2: 'bg-teal-500',
  3: 'bg-blue-500',
  4: 'bg-purple-500',
  5: 'bg-pink-500',
};

// Status Labels
export const STATUS_LABELS: Record<'initialized' | 'idea' | 'designed' | 'tech-spec-ready' | 'metadata-ready' | 'mvp-implemented' | 'technical-testing' | 'design-testing' | 'deployment' | 'deployed', string> = {
  'initialized': 'Initialized',
  'idea': 'Idea',
  'designed': 'Designed',
  'tech-spec-ready': 'Tech Spec Ready',
  'metadata-ready': 'Metadata Ready',
  'mvp-implemented': 'MVP Implemented',
  'technical-testing': 'Technical Testing',
  'design-testing': 'Design Testing',
  'deployment': 'Deployment',
  'deployed': 'Deployed',
};

// Status Colors (Tailwind classes)
export const STATUS_COLORS: Record<'initialized' | 'idea' | 'designed' | 'tech-spec-ready' | 'metadata-ready' | 'mvp-implemented' | 'technical-testing' | 'design-testing' | 'deployment' | 'deployed', string> = {
  'initialized': 'bg-purple-400',
  'idea': 'bg-pink-400',
  'designed': 'bg-orange-400',
  'tech-spec-ready': 'bg-yellow-400',
  'metadata-ready': 'bg-cyan-400',
  'mvp-implemented': 'bg-blue-400',
  'technical-testing': 'bg-indigo-400',
  'design-testing': 'bg-violet-400',
  'deployment': 'bg-teal-400',
  'deployed': 'bg-green-500',
};
