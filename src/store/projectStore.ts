import { create } from 'zustand';
import type { Project, FeedbackItem } from './types';
import * as tauri from '../services/tauri';
import { generateClaudePrompt } from '../services/clipboard';

interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  feedback: FeedbackItem[];
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

  // Set current project and load its feedback
  setCurrentProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { projects } = get();
      const project = projects.find(p => p.id === projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      const feedback = await tauri.getFeedback(project.path);
      set({ currentProject: project, feedback, isLoading: false });
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
  launchClaudeCode: async (projectPath: string, _feedbackIds?: string[]) => {
    console.log('[projectStore] launchClaudeCode started for:', projectPath);
    try {
      const { currentProject } = get();
      console.log('[projectStore] Current project:', currentProject?.name);

      // Generate prompt that references the feedback.json file directly
      console.log('[projectStore] Generating Claude prompt...');
      const prompt = await generateClaudePrompt(
        currentProject?.name || 'Project',
        projectPath
      );
      console.log('[projectStore] Prompt generated, length:', prompt.length);

      // Copy prompt to clipboard first
      console.log('[projectStore] Copying to clipboard...');
      await navigator.clipboard.writeText(prompt);
      console.log('[projectStore] Clipboard copy successful');

      // Then launch Claude Code
      console.log('[projectStore] Calling tauri.launchClaudeCode...');
      await tauri.launchClaudeCode(projectPath, prompt);
      console.log('[projectStore] tauri.launchClaudeCode completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[projectStore] Failed to launch Claude Code:', errorMessage);
      alert(`Failed to launch Claude Code: ${errorMessage}\n\nCheck the debug log for more details.`);
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
