import { create } from 'zustand';
import type { Project, FeedbackItem, Issue } from './types';
import * as tauri from '../services/tauri';
import { generateClaudePrompt } from '../services/clipboard';

interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  feedback: FeedbackItem[];
  archivedFeedback: FeedbackItem[];
  issues: Issue[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  createProject: (projectName: string, summary?: string) => Promise<string | undefined>;
  saveProjectIdea: (projectPath: string, idea: {
    summary: string;
    problem: string;
    coreFunctionality: string;
    valueProposition: string;
    additionalRequirements: string;
  }) => Promise<void>;
  setCurrentProject: (projectId: string) => Promise<void>;
  refreshProject: (projectId: string) => Promise<void>;

  addFeedback: (projectPath: string, feedback: Omit<FeedbackItem, 'id' | 'createdAt'>) => Promise<void>;
  updateFeedback: (projectPath: string, feedbackId: string, updates: Partial<FeedbackItem>) => Promise<void>;
  deleteFeedback: (projectPath: string, feedbackId: string) => Promise<void>;
  toggleFeedbackComplete: (projectPath: string, feedbackId: string) => Promise<void>;
  loadArchivedFeedback: (projectPath: string) => Promise<void>;

  addIssue: (projectPath: string, issue: Omit<Issue, 'id' | 'createdAt' | 'completedAt'>) => Promise<void>;
  updateIssue: (projectPath: string, issueId: string, updates: Partial<Issue>) => Promise<void>;
  deleteIssue: (projectPath: string, issueId: string) => Promise<void>;
  loadIssues: (projectPath: string) => Promise<void>;

  updateProjectMetadata: (projectPath: string, data: { description: string; techStack: string[]; deploymentUrl?: string }) => Promise<void>;

  launchClaudeCode: (projectPath: string, feedbackIds?: string[]) => Promise<void>;
  openInExplorer: (projectPath: string) => Promise<void>;
  openDeploymentUrl: (url: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  feedback: [],
  archivedFeedback: [],
  issues: [],
  isLoading: false,
  error: null,

  // Load all projects
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const settingsStore = await import('./settingsStore');
      const { settings } = settingsStore.useSettingsStore.getState();

      if (!settings?.projectsDirectory) {
        set({ projects: [], isLoading: false });
        return;
      }

      const projects = await tauri.scanProjects(settings.projectsDirectory);

      // Auto-assign colors to projects that don't have one
      for (const project of projects) {
        if (!project.color) {
          try {
            const color = await tauri.assignColorIfMissing(project.path);
            project.color = color;
          } catch {
            // Silently continue if color assignment fails
          }
        }
      }

      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Create new project
  createProject: async (projectName: string, summary?: string) => {
    try {
      const settingsStore = await import('./settingsStore');
      const { settings } = settingsStore.useSettingsStore.getState();

      if (!settings?.projectsDirectory) {
        throw new Error('Projects directory not configured');
      }

      const projectPath = await tauri.createNewProject(settings.projectsDirectory, projectName, summary);

      // Reload projects list to show the new project
      await get().loadProjects();

      // Find the newly created project by path and return its ID
      const { projects } = get();
      const newProject = projects.find(p => p.path === projectPath);
      return newProject?.id;
    } catch (error) {
      throw error;
    }
  },

  // Save project idea
  saveProjectIdea: async (projectPath: string, idea) => {
    try {
      await tauri.saveProjectIdea(
        projectPath,
        idea.summary,
        idea.problem,
        idea.coreFunctionality,
        idea.valueProposition,
        idea.additionalRequirements
      );

      // Reload projects list to reflect updated status
      await get().loadProjects();

      // If this is the current project, refresh it
      const { currentProject, projects } = get();
      if (currentProject?.path === projectPath) {
        // Find the updated project from the projects array to maintain consistent ID
        const updatedProject = projects.find(p => p.path === projectPath);
        if (updatedProject) {
          const feedback = await tauri.getFeedback(projectPath);
          set({ currentProject: updatedProject, feedback });
        }
      }
    } catch (error) {
      throw error;
    }
  },

  // Set current project and load its feedback, issues, and archived feedback
  setCurrentProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { projects } = get();
      const project = projects.find(p => p.id === projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      const [feedback, issues, archivedFeedback] = await Promise.all([
        tauri.getFeedback(project.path),
        tauri.getIssues(project.path),
        tauri.getArchivedFeedback(project.path)
      ]);

      set({ currentProject: project, feedback, issues, archivedFeedback, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Refresh a specific project
  refreshProject: async (projectId: string) => {
    try {
      const { projects } = get();

      const project = projects.find(p => p.id === projectId);

      if (!project) {
        return;
      }

      const updatedProject = await tauri.getProjectDetail(project.path);

      // Preserve the original ID since project IDs are regenerated on each scan
      updatedProject.id = project.id;

      const updatedProjects = projects.map(p =>
        p.path === project.path ? updatedProject : p
      );

      set({ projects: updatedProjects });

      // If this is the current project, update it and reload feedback
      const { currentProject } = get();

      if (currentProject?.path === project.path) {
        const feedback = await tauri.getFeedback(updatedProject.path);
        set({ currentProject: updatedProject, feedback });
      }
    } catch {
      // Silently handle errors
    }
  },

  // Add feedback
  addFeedback: async (projectPath: string, feedbackData) => {
    try {
      const newFeedback = await tauri.addFeedback(projectPath, feedbackData);
      const { feedback } = get();
      set({ feedback: [...feedback, newFeedback].sort((a, b) => a.priority - b.priority) });
    } catch (error) {
      throw error;
    }
  },

  // Update feedback
  updateFeedback: async (projectPath: string, feedbackId: string, updates) => {
    try {
      await tauri.updateFeedback(projectPath, feedbackId, updates);
      const { feedback } = get();
      const updatedFeedback = feedback.map(f =>
        f.id === feedbackId ? { ...f, ...updates } : f
      ).sort((a, b) => a.priority - b.priority);

      set({ feedback: updatedFeedback });
    } catch (error) {
      throw error;
    }
  },

  // Delete feedback
  deleteFeedback: async (projectPath: string, feedbackId: string) => {
    try {
      await tauri.deleteFeedback(projectPath, feedbackId);
      const { feedback } = get();
      set({ feedback: feedback.filter(f => f.id !== feedbackId) });
    } catch (error) {
      throw error;
    }
  },

  // Toggle feedback complete status
  toggleFeedbackComplete: async (projectPath: string, feedbackId: string) => {
    try {
      const { feedback } = get();
      const item = feedback.find(f => f.id === feedbackId);

      if (!item) return;

      const updates: Partial<FeedbackItem> = {
        status: item.status === 'completed' ? 'pending' : 'completed',
        completedAt: item.status === 'completed' ? undefined : new Date().toISOString(),
      };

      await get().updateFeedback(projectPath, feedbackId, updates);
    } catch (error) {
      throw error;
    }
  },

  // Load archived feedback
  loadArchivedFeedback: async (projectPath: string) => {
    try {
      const archivedFeedback = await tauri.getArchivedFeedback(projectPath);
      set({ archivedFeedback });
    } catch (error) {
      throw error;
    }
  },

  // Add issue
  addIssue: async (projectPath: string, issue: Omit<Issue, 'id' | 'createdAt' | 'completedAt'>) => {
    try {
      const newIssue = await tauri.addIssue(projectPath, issue);
      const { issues } = get();
      set({ issues: [...issues, newIssue] });
    } catch (error) {
      throw error;
    }
  },

  // Update issue
  updateIssue: async (projectPath: string, issueId: string, updates: Partial<Issue>) => {
    try {
      await tauri.updateIssue(projectPath, issueId, updates);
      const { issues } = get();
      const updatedIssues = issues.map(i =>
        i.id === issueId ? { ...i, ...updates } : i
      );
      set({ issues: updatedIssues });
    } catch (error) {
      throw error;
    }
  },

  // Delete issue
  deleteIssue: async (projectPath: string, issueId: string) => {
    try {
      await tauri.deleteIssue(projectPath, issueId);
      const { issues } = get();
      set({ issues: issues.filter(i => i.id !== issueId) });
    } catch (error) {
      throw error;
    }
  },

  // Load issues
  loadIssues: async (projectPath: string) => {
    try {
      const issues = await tauri.getIssues(projectPath);
      set({ issues });
    } catch (error) {
      throw error;
    }
  },

  // Update project metadata
  updateProjectMetadata: async (projectPath: string, data) => {
    try {
      await tauri.updateProjectMetadata(projectPath, data);

      // Refresh the current project to show updated data
      const { currentProject } = get();
      if (currentProject) {
        await get().refreshProject(currentProject.id);
      }
    } catch (error) {
      throw error;
    }
  },

  // Launch Claude Code with feedback context
  launchClaudeCode: async (projectPath: string, feedbackIds?: string[]) => {
    try {
      let prompt = '';

      // Only generate a prompt if feedback items are specified
      if (feedbackIds && feedbackIds.length > 0) {
        const { currentProject } = get();
        prompt = await generateClaudePrompt(
          currentProject?.name || 'Project',
          projectPath
        );
      }

      // Launch Claude Code with or without prompt
      await tauri.launchClaudeCode(projectPath, prompt);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[projectStore] Failed to launch Claude Code:', errorMessage);
      throw error;
    }
  },

  // Open in file explorer
  openInExplorer: async (projectPath: string) => {
    try {
      await tauri.openInExplorer(projectPath);
    } catch (error) {
      throw error;
    }
  },

  // Open deployment URL
  openDeploymentUrl: async (url: string) => {
    try {
      await tauri.openUrl(url);
    } catch (error) {
      throw error;
    }
  },
}));
