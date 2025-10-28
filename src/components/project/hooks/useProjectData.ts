import { useEffect, useState } from 'react';
import * as tauri from '../../../services/tauri';
import type { Project } from '../../../store/types';

interface UseProjectDataReturn {
  availableScripts: tauri.AvailableScripts | null;
  githubUrl: string | null;
  docs: tauri.DocumentFile[];
  cleanupStats: tauri.CleanupStats | null;
  projectStats: tauri.ProjectStats | null;
}

export function useProjectData(currentProject: Project | null): UseProjectDataReturn {
  const [availableScripts, setAvailableScripts] = useState<tauri.AvailableScripts | null>(null);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [docs, setDocs] = useState<tauri.DocumentFile[]>([]);
  const [cleanupStats, setCleanupStats] = useState<tauri.CleanupStats | null>(null);
  const [projectStats, setProjectStats] = useState<tauri.ProjectStats | null>(null);

  useEffect(() => {
    if (!currentProject) return;

    // Detect available npm scripts
    tauri.detectNpmScripts(currentProject.path).then(scripts => {
      setAvailableScripts(scripts);
    }).catch(() => {
      // Silently handle error
    });

    // Get GitHub URL
    tauri.getGithubUrl(currentProject.path).then(url => {
      setGithubUrl(url);
    }).catch(() => {
      // Silently handle error
    });

    // Get project documentation files
    tauri.getProjectDocs(currentProject.path).then(docs => {
      setDocs(docs);
    }).catch(() => {
      // Silently handle error
    });

    // Get cleanup stats
    tauri.getCleanupStats(currentProject.path).then(stats => {
      setCleanupStats(stats);
    }).catch(() => {
      // Silently handle error
    });

    // Get project stats
    tauri.getProjectStats(currentProject.path).then(stats => {
      setProjectStats(stats);
    }).catch(() => {
      // Silently handle error
    });
  }, [currentProject]);

  return {
    availableScripts,
    githubUrl,
    docs,
    cleanupStats,
    projectStats,
  };
}
