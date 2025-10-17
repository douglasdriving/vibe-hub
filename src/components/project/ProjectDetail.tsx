import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Terminal, Folder, ExternalLink, Edit, Trash2, Settings, Sparkles, Wrench, Copy } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { Button } from '../common/Button';
import { FeedbackModal } from '../feedback/FeedbackModal';
import { EditProjectModal } from './EditProjectModal';
import type { FeedbackItem } from '../../store/types';
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS, STATUS_COLORS } from '../../store/types';
import { formatDate } from '../../utils/formatters';
import { createMetadataTemplate, generateMetadataPrompt, launchClaudeCode as launchClaudeTauri } from '../../services/tauri';
import { copyToClipboard, generateClaudePrompt } from '../../services/clipboard';

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
    updateProjectMetadata,
    launchClaudeCode,
    openInExplorer,
    openDeploymentUrl,
  } = useProjectStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | undefined>();
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setCurrentProject(id);
    }
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  const handleAddFeedback = () => {
    console.log('Add Feedback button clicked');
    console.log('Current isModalOpen:', isModalOpen);
    setEditingFeedback(undefined);
    setIsModalOpen(true);
    console.log('Set isModalOpen to true');
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

  const handleLaunchClaude = (feedbackIds?: string[]) => {
    if (!currentProject) return;
    launchClaudeCode(currentProject.path, feedbackIds);
  };

  const handleLaunchWithAllPending = () => {
    const pendingIds = feedback.filter(f => f.status === 'pending').map(f => f.id);
    handleLaunchClaude(pendingIds);
  };

  const handleCopyFixPrompt = async () => {
    if (!currentProject) return;
    const pendingFeedback = feedback.filter(f => f.status === 'pending');
    const prompt = generateClaudePrompt(currentProject.name, pendingFeedback);
    await copyToClipboard(prompt);
  };

  const handleLaunchWithoutContext = () => {
    handleLaunchClaude([]);
  };

  const handleOpenExplorer = () => {
    if (!currentProject) return;
    openInExplorer(currentProject.path);
  };

  const handleOpenDeployment = () => {
    if (!currentProject?.deploymentUrl) return;
    openDeploymentUrl(currentProject.deploymentUrl);
  };

  const handleSaveProjectMetadata = async (data: { description: string; techStack: string[]; deploymentUrl?: string }) => {
    if (!currentProject) return;

    try {
      await updateProjectMetadata(currentProject.path, data);
    } catch (error) {
      console.error('Failed to update project metadata:', error);
    }
  };

  const handleGenerateMetadata = async () => {
    if (!currentProject) return;

    try {
      // Create template file if it doesn't exist
      await createMetadataTemplate(currentProject.path);

      // Generate the Claude prompt
      const prompt = await generateMetadataPrompt(currentProject.path, currentProject.name);

      // Copy prompt to clipboard and launch Claude Code directly (not through store)
      await copyToClipboard(prompt);
      await launchClaudeTauri(currentProject.path, prompt);
    } catch (error) {
      console.error('Failed to generate metadata with Claude:', error);
    }
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
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{currentProject.displayName || currentProject.name}</h1>
                  <span className={`${STATUS_COLORS[currentProject.status]} text-white text-sm px-3 py-1 rounded`}>
                    {STATUS_LABELS[currentProject.status]}
                  </span>
                </div>
                {currentProject.lastModified && (
                  <p className="text-sm text-gray-600 mt-1">
                    Last modified: {formatDate(currentProject.lastModified)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {currentProject.deploymentUrl && (
                <Button variant="secondary" size="sm" onClick={handleOpenDeployment}>
                  <ExternalLink size={16} className="inline mr-2" />
                  Open App
                </Button>
              )}
              <Button size="sm" onClick={handleLaunchWithoutContext}>
                <Terminal size={16} className="inline mr-2" />
                Claude
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Project Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-end gap-2 mb-3">
            <Button variant="secondary" size="sm" onClick={handleGenerateMetadata}>
              <Sparkles size={16} className="inline mr-2" />
              Generate
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsEditProjectModalOpen(true)}>
              <Settings size={16} className="inline mr-2" />
              Edit
            </Button>
          </div>

          {currentProject.description ? (
            <p className="text-gray-700 mb-4">{currentProject.description}</p>
          ) : (
            <p className="text-gray-500 text-sm mb-4 italic">No description yet. Click "Edit Info" to add one.</p>
          )}

          {currentProject.techStack && currentProject.techStack.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Tech Stack:</span>
              {currentProject.techStack.map((tech) => (
                <span key={tech} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded">
                  {tech}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-4 italic">No tech stack specified yet.</p>
          )}

          <Button variant="secondary" size="sm" onClick={handleOpenExplorer}>
            <Folder size={16} className="inline mr-2" />
            {currentProject.path}
          </Button>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Feedback & Improvements</h2>
            <div className="flex gap-2">
              {feedback.filter(f => f.status === 'pending').length > 0 && (
                <>
                  <Button variant="secondary" onClick={handleCopyFixPrompt}>
                    <Copy size={18} className="inline mr-2" />
                     Prompt
                  </Button>
                  <Button variant="secondary" onClick={handleLaunchWithAllPending}>
                    <Wrench size={18} className="inline mr-2" />
                    Fix
                  </Button>
                </>
              )}
              <Button onClick={handleAddFeedback}>
                <Plus size={18} className="inline mr-2" />
                Add
              </Button>
            </div>
          </div>

          {feedback.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No feedback items yet.</p>
              <p className="text-sm mt-2">Click "Add Feedback" to create one.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Items */}
              {feedback.filter(f => f.status === 'pending').sort((a, b) => a.priority - b.priority).length > 0 && (
                <div className="space-y-3">
                  {feedback
                    .filter(f => f.status === 'pending')
                    .sort((a, b) => a.priority - b.priority)
                    .map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleComplete(item.id)}
                            className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-gray-900">{item.text}</p>
                              <span className={`${PRIORITY_COLORS[item.priority]} text-white text-xs px-2 py-1 rounded whitespace-nowrap`}>
                                {PRIORITY_LABELS[item.priority]}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              {formatDate(item.createdAt) && (
                                <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => handleEditFeedback(item)} className="text-blue-600 hover:text-blue-800 text-sm">
                                  <Edit size={14} className="inline mr-1" />
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteFeedback(item.id)} className="text-red-600 hover:text-red-800 text-sm">
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

              {/* Completed Items */}
              {feedback.filter(f => f.status === 'completed').length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Implemented</h3>
                  <div className="space-y-3">
                    {feedback
                      .filter(f => f.status === 'completed')
                      .sort((a, b) => a.priority - b.priority)
                      .map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 bg-gray-50 opacity-75">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => handleToggleComplete(item.id)}
                              className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-gray-900 line-through">{item.text}</p>
                                <span className={`${PRIORITY_COLORS[item.priority]} text-white text-xs px-2 py-1 rounded whitespace-nowrap`}>
                                  {PRIORITY_LABELS[item.priority]}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                {formatDate(item.createdAt) && (
                                  <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                                )}
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditFeedback(item)} className="text-blue-600 hover:text-blue-800 text-sm">
                                    <Edit size={14} className="inline mr-1" />
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteFeedback(item.id)} className="text-red-600 hover:text-red-800 text-sm">
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
                </div>
              )}
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

      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        onSave={handleSaveProjectMetadata}
        project={currentProject}
      />
    </div>
  );
}
