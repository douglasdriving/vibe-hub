import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { Project } from '../../store/types';
import { STATUS_LABELS } from '../../store/types';

interface EditMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    displayName: string;
    description: string;
    platform: string;
    status: string;
    deploymentUrl: string;
  }) => Promise<void>;
  project: Project;
}

export function EditMetadataModal({ isOpen, onClose, onSave, project }: EditMetadataModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setDisplayName(project.displayName || project.name);
      setDescription(project.description || '');
      setPlatform(project.platform || '');
      setStatus(project.status);
      setDeploymentUrl(project.deploymentUrl || '');
      setError('');
    }
  }, [isOpen, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave({
        displayName: displayName.trim(),
        description: description.trim(),
        platform: platform.trim(),
        status,
        deploymentUrl: deploymentUrl.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save metadata');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    'initialized',
    'idea',
    'designed',
    'tech-spec-ready',
    'metadata-ready',
    'mvp-implemented',
    'technical-testing',
    'design-testing',
    'deployment',
    'deployed',
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project Metadata">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Display Name
          </label>
          <Input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Project Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the project"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Platform
          </label>
          <Input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g., Web, Desktop, Tauri App, Mobile"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            required
          >
            {statusOptions.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {STATUS_LABELS[statusOption]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Deployment URL
          </label>
          <Input
            type="url"
            value={deploymentUrl}
            onChange={(e) => setDeploymentUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
