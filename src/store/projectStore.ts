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
  createProject: (projectName: string) => Promise<string | undefined>;
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
          } catch (error) {
            console.error(`Failed to assign color to ${project.name}:`, error);
          }
        }
      }

      set({ projects, isLoading: false });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Create new project
  createProject: async (projectName: string) => {
    try {
      const settingsStore = await import('./settingsStore');
      const { settings } = settingsStore.useSettingsStore.getState();

      if (!settings?.projectsDirectory) {
        throw new Error('Projects directory not configured');
      }

      const projectPath = await tauri.createNewProject(settings.projectsDirectory, projectName);

      // Reload projects list to show the new project
      await get().loadProjects();

      // Find the newly created project by path and return its ID
      const { projects } = get();
      const newProject = projects.find(p => p.path === projectPath);
      return newProject?.id;
    } catch (error) {
      console.error('Failed to create project:', error);
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
      console.error('Failed to save project idea:', error);
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
      console.error('Failed to set current project:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Refresh a specific project
  refreshProject: async (projectId: string) => {
    console.log('🟡 refreshProject called with ID:', projectId);
    try {
      const { projects } = get();
      console.log('🟡 All projects:', projects.map(p => ({ id: p.id, path: p.path, status: p.status })));

      const project = projects.find(p => p.id === projectId);
      console.log('🟡 Found project by ID:', project);

      if (!project) {
        console.log('🔴 Project not found! Returning early.');
        return;
      }

      console.log('🟡 Calling getProjectDetail for path:', project.path);
      const updatedProject = await tauri.getProjectDetail(project.path);
      console.log('🟡 Got updated project:', { status: updatedProject.status, id: updatedProject.id });

      // Preserve the original ID since project IDs are regenerated on each scan
      console.log('🟡 Preserving original ID:', project.id);
      updatedProject.id = project.id;

      const updatedProjects = projects.map(p =>
        p.path === project.path ? updatedProject : p
      );
      console.log('🟡 Updated projects array:', updatedProjects.map(p => ({ id: p.id, path: p.path, status: p.status })));

      console.log('🟡 Setting projects in store...');
      set({ projects: updatedProjects });

      // If this is the current project, update it and reload feedback
      const { currentProject } = get();
      console.log('🟡 Current project path:', currentProject?.path);
      console.log('🟡 Updated project path:', project.path);

      if (currentProject?.path === project.path) {
        console.log('🟡 This is the current project, updating currentProject and feedback');
        const feedback = await tauri.getFeedback(updatedProject.path);
        console.log('🟡 Setting currentProject and feedback...');
        set({ currentProject: updatedProject, feedback });
        console.log('🟢 currentProject updated to status:', updatedProject.status);
      } else {
        console.log('🟡 Not the current project, skipping currentProject update');
      }
    } catch (error) {
      console.error('🔴 Failed to refresh project:', error);
    }
  },

  // Add feedback
  addFeedback: async (projectPath: string, feedbackData) => {
    try {
      const newFeedback = await tauri.addFeedback(projectPath, feedbackData);
      const { feedback } = get();
      set({ feedback: [...feedback, newFeedback].sort((a, b) => a.priority - b.priority) });
    } catch (error) {
      console.error('Failed to add feedback:', error);
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
      console.error('Failed to update feedback:', error);
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
      console.error('Failed to delete feedback:', error);
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
      console.error('Failed to toggle feedback:', error);
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
      console.error('Failed to update project metadata:', error);
      throw error;
    }
  },

  // Launch Claude Code with feedback context
  launchClaudeCode: async (projectPath: string, _feedbackIds?: string[]) => {
    try {
      const { currentProject } = get();

      // Generate prompt that references the feedback.json file directly
      const prompt = await generateClaudePrompt(
        currentProject?.name || 'Project',
        projectPath
      );

      // Copy prompt to clipboard first
      await navigator.clipboard.writeText(prompt);

      // Then launch Claude Code
      await tauri.launchClaudeCode(projectPath, prompt);
    } catch (error) {
      console.error('Failed to launch Claude Code:', error);
      throw error;
    }
  },

  // Open in file explorer
  openInExplorer: async (projectPath: string) => {
    try {
      await tauri.openInExplorer(projectPath);
    } catch (error) {
      console.error('Failed to open in explorer:', error);
      throw error;
    }
  },

  // Open deployment URL
  openDeploymentUrl: async (url: string) => {
    try {
      await tauri.openUrl(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
      throw error;
    }
  },
}));
