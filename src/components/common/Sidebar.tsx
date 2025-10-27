import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import * as tauri from '../../services/tauri';

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
  hasClaudeSession: boolean;
  onClick: () => void;
}

function ProjectIcon({ projectName, color, pendingCount, isActive, hasClaudeSession, onClick }: ProjectIconProps) {
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

      {/* Claude session indicator */}
      {hasClaudeSession && (
        <Circle
          size={12}
          className="absolute -bottom-1 -right-1 bg-green-500 fill-current text-green-500 border-2 border-white rounded-full"
        />
      )}
    </button>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useProjectStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sessionStatuses, setSessionStatuses] = useState<Map<string, tauri.SessionInfo>>(new Map());

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Poll for Claude session statuses
  useEffect(() => {
    const loadSessionStatuses = async () => {
      const statuses = new Map<string, tauri.SessionInfo>();
      for (const project of projects) {
        try {
          const status = await tauri.getSessionStatus(project.path);
          statuses.set(project.path, status);
        } catch (error) {
          console.error(`Failed to get session status for ${project.path}:`, error);
        }
      }
      setSessionStatuses(statuses);
    };

    loadSessionStatuses();
    const interval = setInterval(loadSessionStatuses, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [projects]);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

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
    <div
      className={`h-screen bg-gray-900 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-20'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="p-4 text-white hover:bg-gray-800 transition-colors"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
      </button>

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
        {projects.map((project) => {
          const pendingCount = project.feedbackCount || 0;
          const sessionStatus = sessionStatuses.get(project.path);
          const hasClaudeSession = sessionStatus?.status === 'running';
          const isActive = currentProjectPath === project.path;

          return (
            <div key={project.id} className="flex justify-center px-2">
              <ProjectIcon
                projectName={project.displayName || project.name}
                color={project.color || hashStringToColor(project.name)}
                pendingCount={pendingCount}
                isActive={isActive}
                hasClaudeSession={hasClaudeSession}
                onClick={() => handleProjectClick(project.path)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
