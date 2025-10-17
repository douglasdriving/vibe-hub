import { invoke } from '@tauri-apps/api/core';
import type { Project, FeedbackItem, Settings } from '../store/types';

// Project commands
export async function scanProjects(projectsDir: string): Promise<Project[]> {
  return await invoke('scan_projects', { projectsDir });
}

export async function getProjectDetail(projectPath: string): Promise<Project> {
  return await invoke('get_project_detail', { projectPath });
}

export async function createNewProject(projectsDir: string, projectName: string): Promise<string> {
  return await invoke('create_new_project', { projectsDir, projectName });
}

export async function saveProjectIdea(
  projectPath: string,
  summary: string,
  problem: string,
  coreFeatures: string[],
  valueProposition: string,
  additionalRequirements: string
): Promise<void> {
  return await invoke('save_project_idea', {
    projectPath,
    summary,
    problem,
    coreFeatures,
    valueProposition,
    additionalRequirements
  });
}

export async function updateProjectMetadata(
  projectPath: string,
  metadata: { description: string; techStack: string[]; deploymentUrl?: string }
): Promise<void> {
  return await invoke('update_project_metadata', {
    projectPath,
    description: metadata.description,
    techStack: metadata.techStack,
    deploymentUrl: metadata.deploymentUrl
  });
}

export async function createMetadataTemplate(projectPath: string): Promise<void> {
  return await invoke('create_metadata_template', { projectPath });
}

export async function checkMetadataExists(projectPath: string): Promise<boolean> {
  return await invoke('check_metadata_exists', { projectPath });
}

export async function generateMetadataPrompt(projectPath: string, projectName: string): Promise<string> {
  return await invoke('generate_metadata_prompt', { projectPath, projectName });
}

// Feedback commands
export async function getFeedback(projectPath: string): Promise<FeedbackItem[]> {
  return await invoke('get_feedback', { projectPath });
}

export async function addFeedback(
  projectPath: string,
  feedback: Omit<FeedbackItem, 'id' | 'createdAt'>
): Promise<FeedbackItem> {
  return await invoke('add_feedback', { projectPath, feedback });
}

export async function updateFeedback(
  projectPath: string,
  feedbackId: string,
  updates: Partial<FeedbackItem>
): Promise<void> {
  return await invoke('update_feedback', { projectPath, feedbackId, updates });
}

export async function deleteFeedback(
  projectPath: string,
  feedbackId: string
): Promise<void> {
  return await invoke('delete_feedback', { projectPath, feedbackId });
}

// Launcher commands
export async function launchClaudeCode(
  projectPath: string,
  prompt: string
): Promise<void> {
  return await invoke('launch_claude_code', { projectPath, prompt });
}

export async function openInExplorer(projectPath: string): Promise<void> {
  return await invoke('open_in_explorer', { projectPath });
}

export async function openUrl(url: string): Promise<void> {
  return await invoke('open_url', { url });
}

// Settings commands
export async function getSettings(): Promise<Settings> {
  return await invoke('get_settings');
}

export async function updateSettings(settings: Settings): Promise<void> {
  return await invoke('update_settings', { settings });
}

export async function selectDirectory(): Promise<string | null> {
  return await invoke('select_directory');
}
