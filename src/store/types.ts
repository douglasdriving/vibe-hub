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
  status: 'initialized' | 'idea' | 'designed' | 'tech-spec-ready' | 'mvp-implemented' | 'in-progress' | 'deployed'; // Project status
  lastModified?: string;         // From git or filesystem (ISO 8601)
  feedbackCount: number;         // Calculated
  hasUncommittedChanges: boolean; // Git status
}

// Feedback Item Model
export interface FeedbackItem {
  id: string;                    // UUID
  text: string;                  // Feedback content
  priority: 1 | 2 | 3 | 4 | 5;  // Priority level
  status: 'pending' | 'completed';
  createdAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp
}

// Project Metadata (from vibe-hub.json)
export interface ProjectMetadata {
  name?: string;
  description?: string;
  platform?: string;
  isLocalFirst?: boolean;
  isOpenSource?: boolean;
  hasBackend?: boolean;
  deploymentUrl?: string;
  status?: string;
}

// Feedback File Structure
export interface FeedbackFile {
  feedback: FeedbackItem[];
}

// Settings
export interface Settings {
  projectsDirectory: string;
}

// Priority Labels
export const PRIORITY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Critical',
  2: 'High Priority',
  3: 'Medium',
  4: 'Low Priority',
  5: 'Nice to Have',
};

// Priority Colors (Tailwind classes)
export const PRIORITY_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
  5: 'bg-gray-500',
};

// Status Labels
export const STATUS_LABELS: Record<'initialized' | 'idea' | 'designed' | 'tech-spec-ready' | 'mvp-implemented' | 'in-progress' | 'deployed', string> = {
  'initialized': 'Initialized',
  'idea': 'Idea',
  'designed': 'Designed',
  'tech-spec-ready': 'Tech Spec Ready',
  'mvp-implemented': 'MVP Implemented',
  'in-progress': 'In Progress',
  'deployed': 'Deployed',
};

// Status Colors (Tailwind classes)
export const STATUS_COLORS: Record<'initialized' | 'idea' | 'designed' | 'tech-spec-ready' | 'mvp-implemented' | 'in-progress' | 'deployed', string> = {
  'initialized': 'bg-purple-400',
  'idea': 'bg-pink-400',
  'designed': 'bg-orange-400',
  'tech-spec-ready': 'bg-yellow-400',
  'mvp-implemented': 'bg-blue-400',
  'in-progress': 'bg-blue-500',
  'deployed': 'bg-green-500',
};
