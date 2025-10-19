import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, RefreshCw, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ProjectCard } from './ProjectCard';
import { Button } from '../common/Button';
import { NewProjectModal } from '../project/NewProjectModal';
import { APP_NAME } from '../../utils/constants';

export function Dashboard() {
  const navigate = useNavigate();
  const { projects, isLoading, loadProjects, createProject, error } = useProjectStore();
  const { settings } = useSettingsStore();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    if (settings?.projectsDirectory) {
      console.log('Loading projects from:', settings.projectsDirectory);
      loadProjects();
    }
  }, [settings?.projectsDirectory, loadProjects]);

  // Log any errors
  useEffect(() => {
    if (error) {
      console.error('Dashboard error:', error);
    }
  }, [error]);

  const handleRefresh = () => {
    loadProjects();
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleCreateProject = async (projectName: string) => {
    const projectId = await createProject(projectName);
    if (projectId) {
      navigate(`/project/${projectId}`);
    }
  };

  // Log settings for debugging
  console.log('Dashboard settings:', settings);
  console.log('Projects:', projects);
  console.log('Is loading:', isLoading);

  // Empty state - no projects directory configured
  if (!settings?.projectsDirectory) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl uppercase text-gray-900 mb-4">{APP_NAME}</h1>
          <p className="text-gray-600 mb-6">
            Welcome! Please configure your projects directory to get started.
          </p>
          <Button onClick={handleSettings}>
            <Settings size={18} className="inline mr-2" />
            Open Settings
          </Button>
        </div>
      </div>
    );
  }

  // Empty state - no projects found
  if (!isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen">
        <header className="shadow-sm">
          <div className="px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-6xl uppercase text-gray-900">{APP_NAME}</h1>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={() => setIsNewProjectModalOpen(true)}>
                <Plus size={16} className="inline mr-2" />
                New Project
              </Button>
              <Button variant="secondary" size="sm" onClick={handleRefresh}>
                <RefreshCw size={16} className="inline mr-2" />
                Refresh
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSettings}>
                <Settings size={16} className="inline mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No projects found in: <code className="bg-gray-100 px-2 py-1 rounded">{settings.projectsDirectory}</code>
            </p>
            <p className="text-gray-500 text-sm">
              Make sure your projects folder contains subdirectories with git repositories.
            </p>
          </div>
        </main>

        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreate={handleCreateProject}
        />
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen">
      <header className="shadow-sm">
        <div className="px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-6xl uppercase text-gray-900">{APP_NAME}</h1>
            <p className="text-base text-gray-600 mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsNewProjectModalOpen(true)}>
              <Plus size={16} className="inline mr-2" />
              New Project
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={16} className={`inline mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSettings}>
              <Settings size={16} className="inline mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-600">Loading projects...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
