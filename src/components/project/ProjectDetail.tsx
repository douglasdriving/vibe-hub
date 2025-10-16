import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Terminal, Folder, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { Button } from '../common/Button';
import { FeedbackModal } from '../feedback/FeedbackModal';
import type { FeedbackItem } from '../../store/types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../store/types';
import { formatDate } from '../../utils/formatters';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentProject,
    feedback,
    setCurrentProject,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    toggleFeedbackComplete,
    launchClaudeCode,
    openInExplorer,
    openDeploymentUrl,
  } = useProjectStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | undefined>();

  useEffect(() => {
    if (id) {
      setCurrentProject(id);
    }
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  const handleAddFeedback = () => {
    setEditingFeedback(undefined);
    setIsModalOpen(true);
  };

  const handleEditFeedback = (item: FeedbackItem) => {
    setEditingFeedback(item);
    setIsModalOpen(true);
  };

  const handleSaveFeedback = async (feedbackData: Omit<FeedbackItem, 'id' | 'createdAt'>) => {
    if (!currentProject) return;

    try {
      if (editingFeedback) {
        await updateFeedback(currentProject.path, editingFeedback.id, {
          ...editingFeedback,
          ...feedbackData,
        });
      } else {
        await addFeedback(currentProject.path, feedbackData);
      }
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!currentProject) return;
    if (!confirm('Are you sure you want to delete this feedback item?')) return;

    try {
      await deleteFeedback(currentProject.path, feedbackId);
    } catch (error) {
      console.error('Failed to delete feedback:', error);
    }
  };

  const handleToggleComplete = async (feedbackId: string) => {
    if (!currentProject) return;

    try {
      await toggleFeedbackComplete(currentProject.path, feedbackId);
    } catch (error) {
      console.error('Failed to toggle feedback:', error);
    }
  };

  const handleLaunchClaude = () => {
    if (!currentProject) return;
    launchClaudeCode(currentProject.path);
  };

  const handleOpenExplorer = () => {
    if (!currentProject) return;
    openInExplorer(currentProject.path);
  };

  const handleOpenDeployment = () => {
    if (!currentProject?.deploymentUrl) return;
    openDeploymentUrl(currentProject.deploymentUrl);
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Last modified: {formatDate(currentProject.lastModified)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleOpenExplorer}>
                <Folder size={16} className="inline mr-2" />
                Explorer
              </Button>
              {currentProject.deploymentUrl && (
                <Button variant="secondary" size="sm" onClick={handleOpenDeployment}>
                  <ExternalLink size={16} className="inline mr-2" />
                  Open App
                </Button>
              )}
              <Button size="sm" onClick={handleLaunchClaude}>
                <Terminal size={16} className="inline mr-2" />
                Claude Code
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Project Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Information</h2>

          {currentProject.description && (
            <p className="text-gray-700 mb-4">{currentProject.description}</p>
          )}

          {currentProject.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Tech Stack:</span>
              {currentProject.techStack.map((tech) => (
                <span key={tech} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded">
                  {tech}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-600">
            <span className="font-medium">Path:</span>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">{currentProject.path}</code>
          </p>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Feedback & Improvements</h2>
            <Button onClick={handleAddFeedback}>
              <Plus size={18} className="inline mr-2" />
              Add Feedback
            </Button>
          </div>

          {feedback.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No feedback items yet.</p>
              <p className="text-sm mt-2">Click "Add Feedback" to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.status === 'completed' ? 'bg-gray-50 opacity-75' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.status === 'completed'}
                      onChange={() => handleToggleComplete(item.id)}
                      className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <p className={`text-gray-900 ${item.status === 'completed' ? 'line-through' : ''}`}>
                          {item.text}
                        </p>
                        <span className={`${PRIORITY_COLORS[item.priority]} text-white text-xs px-2 py-1 rounded whitespace-nowrap`}>
                          {PRIORITY_LABELS[item.priority]}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(item.createdAt)}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditFeedback(item)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <Edit size={14} className="inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFeedback(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <Trash2 size={14} className="inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFeedback}
        initialData={editingFeedback}
      />
    </div>
  );
}
