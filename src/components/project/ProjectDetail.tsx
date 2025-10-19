import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Terminal, Folder, ExternalLink, Edit, Trash2, Wrench, Copy } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { Button } from '../common/Button';
import { FeedbackModal } from '../feedback/FeedbackModal';
import { ProjectSetupCard } from './ProjectSetupCard';
import type { FeedbackItem } from '../../store/types';
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS, STATUS_COLORS } from '../../store/types';
import { formatDate } from '../../utils/formatters';
import { copyToClipboard, generateClaudePrompt } from '../../services/clipboard';
import { isSetupStatus } from '../../utils/prompts';

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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only load project if we haven't loaded it yet, or if the ID changed
    if (id && (!currentProject || currentProject.id !== id || !hasLoaded)) {
      setCurrentProject(id);
      setHasLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPriorityFilter) {
          setShowPriorityFilter(false);
        } else {
          navigate('/');
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (showPriorityFilter && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPriorityFilter(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navigate, showPriorityFilter]);

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

  const handleCopyFixPrompt = async (minPriority?: number) => {
    if (!currentProject) return;
    let pendingFeedback = feedback.filter(f => f.status === 'pending');

    // Filter by priority if specified (1 = Critical, 5 = Nice to Have)
    // minPriority means "include priority X and higher (lower number)"
    if (minPriority !== undefined) {
      pendingFeedback = pendingFeedback.filter(f => f.priority <= minPriority);
    }

    const prompt = await generateClaudePrompt(currentProject.name, pendingFeedback);
    await copyToClipboard(prompt);
    setShowPriorityFilter(false); // Close dropdown after copying
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


  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: currentProject.color, color: currentProject.textColor || '#FFFFFF' }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: currentProject.color }}>
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="hover:opacity-75"
                style={{ color: currentProject.textColor || '#FFFFFF' }}
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-6xl uppercase" style={{ color: currentProject.textColor || '#FFFFFF' }}>{currentProject.displayName || currentProject.name}</h1>
                  <span className={`${STATUS_COLORS[currentProject.status]} text-white text-base px-3 py-1 rounded`}>
                    {STATUS_LABELS[currentProject.status]}
                  </span>
                </div>
                {currentProject.lastModified && (
                  <p className="mt-1" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.8 }}>
                    Last modified: {formatDate(currentProject.lastModified)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {currentProject.deploymentUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenDeployment}
                  invertedBgColor={currentProject.textColor}
                  invertedTextColor={currentProject.color}
                >
                  <ExternalLink size={16} className="inline mr-2" />
                  Open App
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleLaunchWithoutContext}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
              >
                <Terminal size={16} className="inline mr-2" />
                Claude
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Project Setup Card - only shown for setup stages */}
        <ProjectSetupCard project={currentProject} />

        {/* Project Info */}
        <div className="rounded-lg shadow p-6 mb-6" style={{ backgroundColor: currentProject.color }}>
          {currentProject.description ? (
            <p className="mb-4" style={{ color: currentProject.textColor || '#FFFFFF' }}>{currentProject.description}</p>
          ) : (
            <p className="mb-4 italic" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>No description yet. Complete the project setup to add one.</p>
          )}

          {/* Platform & Architecture */}
          {(currentProject.platform || currentProject.isLocalFirst || currentProject.isOpenSource || currentProject.hasBackend) ? (
            <div className="flex flex-wrap gap-2 mb-4">
              <span style={{ color: currentProject.textColor || '#FFFFFF' }}>Platform & Architecture:</span>
              {currentProject.platform && (
                <span className="bg-blue-100 text-blue-700 text-base px-3 py-1 rounded">{currentProject.platform}</span>
              )}
              {currentProject.isLocalFirst && (
                <span className="bg-green-100 text-green-700 text-base px-3 py-1 rounded">Local-First</span>
              )}
              {currentProject.isOpenSource && (
                <span className="bg-purple-100 text-purple-700 text-base px-3 py-1 rounded">Open Source</span>
              )}
              {currentProject.hasBackend && (
                <span className="bg-orange-100 text-orange-700 text-base px-3 py-1 rounded">Has Backend</span>
              )}
            </div>
          ) : (
            <p className="mb-4 italic" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>No platform info specified yet.</p>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenExplorer}
            invertedBgColor={currentProject.textColor}
            invertedTextColor={currentProject.color}
          >
            <Folder size={16} className="inline mr-2" />
            Open Folder
          </Button>
        </div>

        {/* Feedback Section - only show for projects past setup stages */}
        {!isSetupStatus(currentProject.status) && (
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: currentProject.color }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg" style={{ color: currentProject.textColor || '#FFFFFF' }}>Feedback & Improvements</h2>
            <div className="flex gap-2">
              {feedback.filter(f => f.status === 'pending').length > 0 && (
                <>
                  {/* Copy Prompt with Priority Filter */}
                  <div className="relative" ref={dropdownRef}>
                    <Button
                      variant="secondary"
                      onClick={() => setShowPriorityFilter(!showPriorityFilter)}
                      invertedBgColor={currentProject.textColor}
                      invertedTextColor={currentProject.color}
                    >
                      <Copy size={18} className="inline mr-2" />
                       Prompt ▾
                    </Button>
                    {showPriorityFilter && (() => {
                      const pendingFeedback = feedback.filter(f => f.status === 'pending');
                      const totalCount = pendingFeedback.length;

                      // Count items at each priority level
                      const priorityCounts = {
                        1: pendingFeedback.filter(f => f.priority <= 1).length,
                        2: pendingFeedback.filter(f => f.priority <= 2).length,
                        3: pendingFeedback.filter(f => f.priority <= 3).length,
                        4: pendingFeedback.filter(f => f.priority <= 4).length,
                        5: pendingFeedback.filter(f => f.priority <= 5).length,
                      };

                      // Check which priorities actually exist
                      const hasPriority = {
                        1: pendingFeedback.some(f => f.priority === 1),
                        2: pendingFeedback.some(f => f.priority === 2),
                        3: pendingFeedback.some(f => f.priority === 3),
                        4: pendingFeedback.some(f => f.priority === 4),
                        5: pendingFeedback.some(f => f.priority === 5),
                      };

                      return (
                        <div className="absolute top-full mt-1 right-0 bg-white border-2 border-black rounded shadow-lg z-10 min-w-[220px]">
                          <button
                            onClick={() => handleCopyFixPrompt()}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium border-b border-gray-200 text-gray-900 flex justify-between items-center"
                          >
                            <span>All Pending</span>
                            <span className="text-gray-500 text-xs">({totalCount})</span>
                          </button>

                          {hasPriority[1] && (
                            <button
                              onClick={() => handleCopyFixPrompt(1)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-200 text-gray-900 flex justify-between items-center"
                            >
                              <span>
                                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                                Critical only
                              </span>
                              <span className="text-gray-500 text-xs">({priorityCounts[1]})</span>
                            </button>
                          )}

                          {hasPriority[2] && (
                            <button
                              onClick={() => handleCopyFixPrompt(2)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-200 text-gray-900 flex justify-between items-center"
                            >
                              <span>
                                <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                                High Priority & above
                              </span>
                              <span className="text-gray-500 text-xs">({priorityCounts[2]})</span>
                            </button>
                          )}

                          {hasPriority[3] && (
                            <button
                              onClick={() => handleCopyFixPrompt(3)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-200 text-gray-900 flex justify-between items-center"
                            >
                              <span>
                                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                                Medium & above
                              </span>
                              <span className="text-gray-500 text-xs">({priorityCounts[3]})</span>
                            </button>
                          )}

                          {hasPriority[4] && (
                            <button
                              onClick={() => handleCopyFixPrompt(4)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 flex justify-between items-center"
                              style={{ borderBottom: hasPriority[5] ? '1px solid #e5e7eb' : 'none' }}
                            >
                              <span>
                                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                                Low Priority & above
                              </span>
                              <span className="text-gray-500 text-xs">({priorityCounts[4]})</span>
                            </button>
                          )}

                          {hasPriority[5] && (
                            <button
                              onClick={() => handleCopyFixPrompt(5)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 flex justify-between items-center"
                            >
                              <span>
                                <span className="inline-block w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
                                Nice to Have & above
                              </span>
                              <span className="text-gray-500 text-xs">({priorityCounts[5]})</span>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleLaunchWithAllPending}
                    invertedBgColor={currentProject.textColor}
                    invertedTextColor={currentProject.color}
                  >
                    <Wrench size={18} className="inline mr-2" />
                    Fix
                  </Button>
                </>
              )}
              <Button
                onClick={handleAddFeedback}
                invertedBgColor={currentProject.textColor}
                invertedTextColor={currentProject.color}
              >
                <Plus size={18} className="inline mr-2" />
                Add
              </Button>
            </div>
          </div>

          {feedback.length === 0 ? (
            <div className="text-center py-12" style={{ color: currentProject.textColor || '#FFFFFF', opacity: 0.7 }}>
              <p>No feedback items yet.</p>
              <p className="mt-2">Click "Add Feedback" to create one.</p>
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
                      <div key={item.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 shadow-lg">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleComplete(item.id)}
                            className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-white">{item.text}</p>
                              <span className={`${PRIORITY_COLORS[item.priority]} text-white text-base px-2 py-1 rounded whitespace-nowrap`}>
                                {PRIORITY_LABELS[item.priority]}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              {formatDate(item.createdAt) && (
                                <span className="text-white/80">{formatDate(item.createdAt)}</span>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => handleEditFeedback(item)} className="text-yellow-300 hover:text-yellow-100">
                                  <Edit size={14} className="inline mr-1" />
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteFeedback(item.id)} className="text-red-300 hover:text-red-100">
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
                  <h3 className="text-md mb-3" style={{ color: currentProject.textColor || '#FFFFFF' }}>Implemented</h3>
                  <div className="space-y-3">
                    {feedback
                      .filter(f => f.status === 'completed')
                      .sort((a, b) => a.priority - b.priority)
                      .map((item) => (
                        <div key={item.id} className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 shadow-lg opacity-60">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => handleToggleComplete(item.id)}
                              className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-white line-through">{item.text}</p>
                                <span className={`${PRIORITY_COLORS[item.priority]} text-white text-base px-2 py-1 rounded whitespace-nowrap`}>
                                  {PRIORITY_LABELS[item.priority]}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                {formatDate(item.createdAt) && (
                                  <span className="text-white/80">{formatDate(item.createdAt)}</span>
                                )}
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditFeedback(item)} className="text-yellow-300 hover:text-yellow-100">
                                    <Edit size={14} className="inline mr-1" />
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteFeedback(item.id)} className="text-red-300 hover:text-red-100">
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
        )}
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
