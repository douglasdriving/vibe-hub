import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Upload, Trash2 } from 'lucide-react';
import type { Project } from '../../store/types';
import { STATUS_LABELS } from '../../store/types';
import * as tauri from '../../services/tauri';

interface EditMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    displayName: string;
    description: string;
    platform: string;
    status: string;
    deploymentUrl: string;
    iconPath: string | null;
  }) => Promise<void>;
  project: Project;
}

export function EditMetadataModal({ isOpen, onClose, onSave, project }: EditMetadataModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [iconPath, setIconPath] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setDisplayName(project.displayName || project.name);
      setDescription(project.description || '');
      setPlatform(project.platform || '');
      setStatus(project.status);
      setDeploymentUrl(project.deploymentUrl || '');
      setIconPath(project.iconPath || null);
      // Set preview if icon exists
      if (project.iconPath) {
        // Construct absolute path properly
        const iconPathNormalized = project.iconPath.replace(/\//g, '\\');
        const fullIconPath = `${project.path}\\${iconPathNormalized}`;

        // Use base64 data URL instead of asset protocol
        tauri.getIconDataUrl(fullIconPath)
          .then(dataUrl => {
            setIconPreview(dataUrl);
          })
          .catch(err => {
            console.error('[EditMetadataModal] Failed to load icon:', err);
            setIconPreview(null);
          });
      } else {
        setIconPreview(null);
      }
      setError('');
    }
  }, [isOpen, project]);

  const handleFileSelect = async () => {
    try {
      setError('');

      // Use Tauri dialog to select image file, starting in project root
      const selectedPath = await tauri.selectImageFile(project.path);
      if (!selectedPath) return; // User cancelled

      // Upload the icon
      const newIconPath = await tauri.uploadProjectIcon(project.path, selectedPath);
      setIconPath(newIconPath);

      // Set preview using base64 data URL
      const iconPathNormalized = newIconPath.replace(/\//g, '\\');
      const fullIconPath = `${project.path}\\${iconPathNormalized}`;
      const dataUrl = await tauri.getIconDataUrl(fullIconPath);
      setIconPreview(dataUrl);
    } catch (err) {
      console.error('[EditMetadataModal] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload icon');
    }
  };

  const handleRemoveIcon = () => {
    setIconPath(null);
    setIconPreview(null);
  };

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
        iconPath,
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
            Project Icon
          </label>
          <div className="flex items-center gap-3">
            {iconPreview ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0">
                  <img
                    src={iconPreview}
                    alt="Project icon"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRemoveIcon}
                  disabled={isSaving}
                >
                  <Trash2 size={16} className="mr-2" />
                  Remove Icon
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleFileSelect}
                  disabled={isSaving}
                >
                  <Upload size={16} className="mr-2" />
                  Upload Icon
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, SVG, GIF, or WebP (max 5MB)
                </p>
              </div>
            )}
          </div>
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
