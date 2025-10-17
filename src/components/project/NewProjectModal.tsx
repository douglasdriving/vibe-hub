import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectName: string) => Promise<void>;
}

export function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Convert project name to folder name format
  const getFolderName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    const folderName = getFolderName(projectName);
    if (!folderName) {
      setError('Project name must contain at least one letter or number');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onCreate(projectName.trim());
      setProjectName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setProjectName('');
      setError('');
      onClose();
    }
  };

  const folderName = getFolderName(projectName);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Project Name
          </label>
          <input
            autoFocus
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={isCreating}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="My Awesome Project"
          />
          {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
          {projectName && folderName && (
            <p className="mt-2 text-sm text-gray-600">
              Folder name: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{folderName}</span>
            </p>
          )}
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Project folder created with .vibe structure</li>
            <li>✓ Git repository initialized</li>
            <li>✓ Ready to write your project pitch!</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || !projectName.trim()}>
            {isCreating ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
