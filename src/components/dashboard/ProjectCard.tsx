import { useNavigate } from 'react-router-dom';
import { ExternalLink, Folder, Terminal } from 'lucide-react';
import type { Project } from '../../store/types';
import { STATUS_LABELS, STATUS_COLORS } from '../../store/types';
import { formatRelativeTime } from '../../utils/formatters';
import { useProjectStore } from '../../store/projectStore';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const { openInExplorer, launchClaudeCode } = useProjectStore();

  const handleOpenProject = () => {
    navigate(`/project/${project.id}`);
  };

  const handleOpenExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    openInExplorer(project.path);
  };

  const handleLaunchClaude = (e: React.MouseEvent) => {
    e.stopPropagation();
    launchClaudeCode(project.path);
  };

  return (
    <div
      onClick={handleOpenProject}
      className="bg-gradient-to-br from-purple-300 via-pink-300 to-orange-300 rounded-lg shadow-md p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-4 border-purple-500 hover:border-pink-500"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{project.displayName || project.name}</h3>
          <span className={`${STATUS_COLORS[project.status]} text-white text-xs px-2 py-1 rounded mt-1 inline-block`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        {project.feedbackCount > 0 && (
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
            {project.feedbackCount}
          </span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Platform & Architecture Info */}
      {(project.platform || project.isLocalFirst !== undefined || project.isOpenSource !== undefined || project.hasBackend !== undefined) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.platform && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
              {project.platform}
            </span>
          )}
          {project.isLocalFirst && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
              Local-First
            </span>
          )}
          {project.isOpenSource && (
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
              Open Source
            </span>
          )}
          {project.hasBackend && (
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">
              Has Backend
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {project.lastModified && <span>{formatRelativeTime(project.lastModified)}</span>}
          {project.deploymentUrl && (
            <span className="flex items-center gap-1 text-green-600">
              <ExternalLink size={14} />
              Deployed
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleOpenExplorer}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Open in Explorer"
          >
            <Folder size={18} />
          </button>
          <button
            onClick={handleLaunchClaude}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Open Claude Code"
          >
            <Terminal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
