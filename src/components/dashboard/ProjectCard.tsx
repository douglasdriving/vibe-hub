import { useNavigate } from 'react-router-dom';
import { ExternalLink, Folder, Terminal } from 'lucide-react';
import type { Project } from '../../store/types';
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
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
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

      {/* Tech Stack */}
      {project.techStack && project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.techStack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > 3 && (
            <span className="text-gray-500 text-xs px-2 py-1">
              +{project.techStack.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{formatRelativeTime(project.lastModified)}</span>
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
