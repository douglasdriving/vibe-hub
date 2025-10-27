import { useNavigate, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import type { Project } from '../../store/types';

// Status sort order (workflow order)
const STATUS_ORDER = [
  'deployed',
  'deployment',
  'design-testing',
  'technical-testing',
  'mvp-implemented',
  'metadata-ready',
  'tech-spec-ready',
  'designed',
  'idea',
  'initialized',
];

// Sort projects by status (workflow order) and then by lastModified within each status group
function sortProjectsByStatus(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const aStatusIndex = STATUS_ORDER.indexOf(a.status);
    const bStatusIndex = STATUS_ORDER.indexOf(b.status);

    // First sort by status
    if (aStatusIndex !== bStatusIndex) {
      return aStatusIndex - bStatusIndex;
    }

    // Then sort by lastModified within same status (newest first)
    const aTime = a.lastModified ? new Date(a.lastModified).getTime() : 0;
    const bTime = b.lastModified ? new Date(b.lastModified).getTime() : 0;
    return bTime - aTime;
  });
}

// Group projects by status
function groupProjectsByStatus(projects: Project[]): Map<string, Project[]> {
  const groups = new Map<string, Project[]>();

  for (const project of projects) {
    const status = project.status;
    if (!groups.has(status)) {
      groups.set(status, []);
    }
    groups.get(status)!.push(project);
  }

  return groups;
}

// Generate a consistent color from a string using a simple hash
function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with good saturation and lightness
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

interface ProjectIconProps {
  projectName: string;
  color: string;
  pendingCount: number;
  isActive: boolean;
  onClick: () => void;
}

function ProjectIcon({ projectName, color, pendingCount, isActive, onClick }: ProjectIconProps) {
  const initial = projectName.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all hover:scale-110 ${
        isActive ? 'ring-4 ring-white' : ''
      }`}
      style={{ backgroundColor: color }}
      title={projectName}
    >
      {initial}

      {/* Pending count badge */}
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useProjectStore();

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleProjectClick = (projectPath: string) => {
    console.log('[Sidebar] Project clicked:', projectPath);
    const encodedPath = encodeURIComponent(projectPath);
    console.log('[Sidebar] Encoded path:', encodedPath);
    const targetUrl = `/project/${encodedPath}`;
    console.log('[Sidebar] Navigating to:', targetUrl);
    try {
      navigate(targetUrl);
      console.log('[Sidebar] Navigation called successfully');
    } catch (error) {
      console.error('[Sidebar] Navigation error:', error);
    }
  };

  const isOnDashboard = location.pathname === '/';
  const currentProjectPath = location.pathname.startsWith('/project/')
    ? decodeURIComponent(location.pathname.replace('/project/', ''))
    : null;

  return (
    <div className="h-screen bg-gray-900 flex flex-col w-20">
      {/* Home button */}
      <button
        onClick={handleHomeClick}
        className={`p-4 text-white hover:bg-gray-800 transition-colors flex items-center justify-center ${
          isOnDashboard ? 'bg-gray-800' : ''
        }`}
        title="Dashboard"
      >
        <Home size={24} />
      </button>

      {/* Divider */}
      <div className="border-t border-gray-700 my-2" />

      {/* Project list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4">
        {(() => {
          const sortedProjects = sortProjectsByStatus(projects);
          const groupedProjects = groupProjectsByStatus(sortedProjects);
          const statusGroups: React.ReactElement[] = [];

          // Render groups in status order
          STATUS_ORDER.forEach((status) => {
            const projectsInStatus = groupedProjects.get(status);
            if (!projectsInStatus || projectsInStatus.length === 0) return;

            // Add divider before each group (except the first)
            if (statusGroups.length > 0) {
              statusGroups.push(
                <div key={`divider-${status}`} className="border-t-2 border-gray-700 mx-4 my-2" />
              );
            }

            // Add projects in this status group
            projectsInStatus.forEach((project) => {
              const pendingCount = project.feedbackCount || 0;
              const isActive = currentProjectPath === project.path;

              statusGroups.push(
                <div key={project.id} className="flex justify-center px-2">
                  <ProjectIcon
                    projectName={project.displayName || project.name}
                    color={project.color || hashStringToColor(project.name)}
                    pendingCount={pendingCount}
                    isActive={isActive}
                    onClick={() => handleProjectClick(project.path)}
                  />
                </div>
              );
            });
          });

          return statusGroups;
        })()}
      </div>
    </div>
  );
}
