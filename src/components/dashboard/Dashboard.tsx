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
  const { projects, isLoading, loadProjects, createProject } = useProjectStore();
  const { settings } = useSettingsStore();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    if (settings?.projectsDirectory) {
      loadProjects();
    }
  }, [settings?.projectsDirectory, loadProjects]);

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

  // Empty state - no projects directory configured
  if (!settings?.projectsDirectory) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl uppercase text-purple-700 font-bold mb-4" style={{ textShadow: '3px 3px 0px rgba(0,0,0,1)' }}>{APP_NAME}</h1>
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
        <header>
          <div className="px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-6xl uppercase text-purple-700 font-bold" style={{ textShadow: '3px 3px 0px rgba(0,0,0,1)' }}>{APP_NAME}</h1>
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

  // Separate projects into active and in-development
  const activeProjects = projects.filter(p =>
    ['mvp-implemented', 'technical-testing', 'design-testing', 'deployment', 'deployed'].includes(p.status)
  );
  const developmentProjects = projects.filter(p =>
    ['initialized', 'idea', 'designed', 'tech-spec-ready', 'metadata-ready'].includes(p.status)
  );

  // Main dashboard
  return (
    <div className="min-h-screen">
      <header>
        <div className="px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-6xl uppercase text-purple-700 font-bold" style={{ textShadow: '3px 3px 0px rgba(0,0,0,1)' }}>{APP_NAME}</h1>
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
          <div className="space-y-12">
            {/* Active Projects Section */}
            {activeProjects.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold text-purple-700 mb-6 uppercase" style={{ textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>
                  Active ({activeProjects.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}

            {/* Projects in Development Section */}
            {developmentProjects.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold text-purple-700 mb-6 uppercase" style={{ textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>
                  Drafts ({developmentProjects.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {developmentProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}
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
