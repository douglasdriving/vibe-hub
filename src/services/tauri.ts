import { invoke } from '@tauri-apps/api/core';
import type { Project, FeedbackItem, Issue, Settings } from '../store/types';

// Project commands
export async function scanProjects(projectsDir: string): Promise<Project[]> {
  return await invoke('scan_projects', { projectsDir });
}

export async function getProjectDetail(projectPath: string): Promise<Project> {
  return await invoke('get_project_detail', { projectPath });
}

export async function createNewProject(projectsDir: string, projectName: string, summary?: string): Promise<string> {
  return await invoke('create_new_project', { projectsDir, projectName, summary });
}

export interface ProjectIdea {
  summary: string;
  problem: string;
  coreFunctionality: string;
  valueProposition: string;
  additionalRequirements: string;
}

export async function saveProjectIdea(
  projectPath: string,
  summary: string,
  problem: string,
  coreFunctionality: string,
  valueProposition: string,
  additionalRequirements: string
): Promise<void> {
  return await invoke('save_project_idea', {
    projectPath,
    summary,
    problem,
    coreFunctionality,
    valueProposition,
    additionalRequirements
  });
}

export async function getProjectIdea(projectPath: string): Promise<ProjectIdea | null> {
  return await invoke('get_project_idea', { projectPath });
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

export async function updateAllMetadata(
  projectPath: string,
  displayName: string | null,
  description: string,
  platform: string | null,
  status: string,
  deploymentUrl: string | null
): Promise<void> {
  return await invoke('update_all_metadata', {
    projectPath,
    displayName,
    description,
    platform,
    status,
    deploymentUrl
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

export async function getArchivedFeedback(projectPath: string): Promise<FeedbackItem[]> {
  return await invoke('get_archived_feedback', { projectPath });
}

export async function moveFeedbackToArchive(
  projectPath: string,
  feedbackId: string,
  refinedIntoIssueIds: string[]
): Promise<void> {
  return await invoke('move_feedback_to_archive', { projectPath, feedbackId, refinedIntoIssueIds });
}

// Issue commands
export async function getIssues(projectPath: string): Promise<Issue[]> {
  return await invoke('get_issues', { projectPath });
}

export async function addIssue(
  projectPath: string,
  issue: Omit<Issue, 'id' | 'createdAt' | 'completedAt'>
): Promise<Issue> {
  return await invoke('add_issue', { projectPath, issue });
}

export async function updateIssue(
  projectPath: string,
  issueId: string,
  updates: Partial<Issue>
): Promise<void> {
  return await invoke('update_issue', { projectPath, issueId, updates });
}

export async function deleteIssue(
  projectPath: string,
  issueId: string
): Promise<void> {
  return await invoke('delete_issue', { projectPath, issueId });
}

// Debug logging
export async function logDebug(message: string): Promise<void> {
  try {
    await invoke('log_debug', { message });
  } catch (error) {
    console.error('[tauri.ts] log_debug failed:', error);
  }
}

// Launcher commands
export async function launchClaudeCode(
  projectPath: string,
  prompt: string
): Promise<void> {
  console.log('[tauri.ts] launchClaudeCode called with:', { projectPath, promptLength: prompt.length });
  await logDebug('[tauri.ts] launchClaudeCode called with path: ' + projectPath);
  try {
    await invoke('launch_claude_code', { projectPath, prompt });
    console.log('[tauri.ts] launchClaudeCode invoke completed successfully');
    await logDebug('[tauri.ts] launchClaudeCode completed successfully');
  } catch (error) {
    console.error('[tauri.ts] launchClaudeCode invoke failed:', error);
    await logDebug('[tauri.ts] launchClaudeCode failed: ' + String(error));
    throw error;
  }
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

// Spec file detection commands
export async function checkSpecFilesExist(projectPath: string): Promise<[boolean, boolean]> {
  return await invoke('check_spec_files_exist', { projectPath });
}

export async function updateProjectStatus(projectPath: string, newStatus: string): Promise<void> {
  return await invoke('update_project_status', { projectPath, newStatus });
}

export async function assignColorIfMissing(projectPath: string): Promise<string> {
  return await invoke('assign_color_if_missing', { projectPath });
}

export async function createDesignFeedbackFile(projectPath: string): Promise<void> {
  return await invoke('create_design_feedback_file', { projectPath });
}

export async function getGithubUrl(projectPath: string): Promise<string | null> {
  return await invoke('get_github_url', { projectPath });
}

export interface DocumentFile {
  name: string;
  path: string;
  location: 'root' | 'vibe' | 'docs';
  modifiedTimestamp: number;
}

export async function getProjectDocs(projectPath: string): Promise<DocumentFile[]> {
  return await invoke('get_project_docs', { projectPath });
}

export interface CleanupStats {
  commitsSinceCleanup: number;
  totalCommits: number;
  cleanupThreshold: number;
  shouldCleanup: boolean;
}

export async function getCleanupStats(projectPath: string): Promise<CleanupStats> {
  return await invoke('get_cleanup_stats', { projectPath });
}

export interface ProjectStats {
  totalCommits: number;
  linesOfCode: number;
  feedbackCompleted: number;
}

export async function getProjectStats(projectPath: string): Promise<ProjectStats> {
  return await invoke('get_project_stats', { projectPath });
}

// Prompts commands
export async function getPrompt(promptName: string, replacements: Record<string, string>): Promise<string> {
  return await invoke('get_prompt', { promptName, replacements });
}

// NPM commands
export interface AvailableScripts {
  has_dev: boolean;
  has_build: boolean;
  dev_script_name: string | null;
  dev_script_type: string | null; // "npm", "bat", or "sh"
  dev_command: string | null;
  build_command: string | null;
}

export async function detectNpmScripts(projectPath: string): Promise<AvailableScripts> {
  return await invoke('detect_npm_scripts', { projectPath });
}

export async function runNpmScript(projectPath: string, scriptName: string, scriptType?: string): Promise<void> {
  return await invoke('run_npm_script', { projectPath, scriptName, scriptType });
}

export async function openInVscode(projectPath: string): Promise<void> {
  return await invoke('open_in_vscode', { projectPath });
}

export async function openInTerminal(projectPath: string): Promise<void> {
  return await invoke('open_in_terminal', { projectPath });
}

export async function openInFork(projectPath: string): Promise<void> {
  return await invoke('open_in_fork', { projectPath });
}

export async function getDebugLogPath(): Promise<string> {
  return await invoke('get_debug_log_path');
}
