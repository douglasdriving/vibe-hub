// Project Model
export interface Project {
  id: string;                    // UUID
  name: string;                  // From folder name
  displayName?: string;          // Nice name from metadata
  path: string;                  // Absolute path
  description: string;           // From vibe-hub.md or manual
  techStack: string[];           // Tags
  deploymentUrl?: string;        // Optional
  status: 'draft' | 'in-progress' | 'deployed'; // Project status
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

// Project Metadata (from vibe-hub.md)
export interface ProjectMetadata {
  description: string;
  deploymentUrl?: string;
  techStack?: string[];
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
export const STATUS_LABELS: Record<'draft' | 'in-progress' | 'deployed', string> = {
  'draft': 'Draft',
  'in-progress': 'In Progress',
  'deployed': 'Deployed',
};

// Status Colors (Tailwind classes)
export const STATUS_COLORS: Record<'draft' | 'in-progress' | 'deployed', string> = {
  'draft': 'bg-gray-400',
  'in-progress': 'bg-blue-500',
  'deployed': 'bg-green-500',
};
