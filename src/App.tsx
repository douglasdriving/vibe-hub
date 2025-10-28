import { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { ProjectDetail } from './components/project/ProjectDetail';
import { Sidebar } from './components/common/Sidebar';
import { useSettingsStore } from './store/settingsStore';
import { useProjectStore } from './store/projectStore';
import { generateFeedbackRefinementPrompt } from './services/clipboard';
import * as tauri from './services/tauri';

function App() {
  const { loadSettings, settings } = useSettingsStore();
  const { projects, loadProjects } = useProjectStore();
  const [isAutoRefining, setIsAutoRefining] = useState(false);
  const [autoRefineStatus, setAutoRefineStatus] = useState('');
  const hasRunAutoRefine = useRef(false);

  useEffect(() => {
    // Load settings on app start
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    // Auto-refine on startup if enabled (only run once per app launch)
    const runAutoRefine = async () => {
      if (!settings?.autoRefineOnStartup || hasRunAutoRefine.current) return;
      if (!settings.projectsDirectory) return;

      hasRunAutoRefine.current = true;
      setIsAutoRefining(true);

      try {
        // Load all projects
        await loadProjects();

        // Get current projects from store
        const currentProjects = useProjectStore.getState().projects;

        // Filter projects with pending feedback (not issues)
        // We need to check if they actually have feedback items, not just feedbackCount > 0
        const projectsWithFeedback: typeof currentProjects = [];
        for (const project of currentProjects) {
          try {
            const feedback = await tauri.getFeedback(project.path);
            const pendingFeedback = feedback.filter(f => f.status === 'pending');
            if (pendingFeedback.length > 0) {
              projectsWithFeedback.push(project);
            }
          } catch (error) {
            console.error(`Failed to check feedback for ${project.name}:`, error);
          }
        }

        if (projectsWithFeedback.length === 0) {
          setAutoRefineStatus('No projects with pending feedback found');
          setTimeout(() => {
            setIsAutoRefining(false);
            setAutoRefineStatus('');
          }, 3000);
          return;
        }

        setAutoRefineStatus(`Auto-refining ${projectsWithFeedback.length} project(s)...`);

        // Process each project sequentially with a small delay
        for (let i = 0; i < projectsWithFeedback.length; i++) {
          const project = projectsWithFeedback[i];
          setAutoRefineStatus(`Refining ${project.name} (${i + 1}/${projectsWithFeedback.length})...`);

          try {
            const prompt = await generateFeedbackRefinementPrompt(project.name, project.path);
            await tauri.launchClaudeCode(project.path, prompt);

            // Small delay between launches to avoid overwhelming the system
            if (i < projectsWithFeedback.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (error) {
            console.error(`Failed to refine ${project.name}:`, error);
          }
        }

        setAutoRefineStatus('Auto-refinement complete!');
        setTimeout(() => {
          setIsAutoRefining(false);
          setAutoRefineStatus('');
        }, 3000);
      } catch (error) {
        console.error('Auto-refine failed:', error);
        setAutoRefineStatus('Auto-refinement failed');
        setTimeout(() => {
          setIsAutoRefining(false);
          setAutoRefineStatus('');
        }, 3000);
      }
    };

    if (settings) {
      runAutoRefine();
    }
  }, [settings, loadProjects]);

  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {/* Auto-refine status banner */}
          {isAutoRefining && autoRefineStatus && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 shadow-lg">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span className="font-semibold">{autoRefineStatus}</span>
                </div>
              </div>
            </div>
          )}

          <div className="px-2 sm:px-4 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<SettingsPanel />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
            </Routes>
          </div>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
