import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Project } from '../../store/types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { description: string; techStack: string[]; deploymentUrl?: string }) => void;
  project: Project;
}

export function EditProjectModal({ isOpen, onClose, onSave, project }: EditProjectModalProps) {
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription(project.description || '');
      setTechStackInput(project.techStack?.join(', ') || '');
      setDeploymentUrl(project.deploymentUrl || '');
    }
  }, [isOpen, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSave({
      description: description.trim(),
      techStack,
      deploymentUrl: deploymentUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project Information">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Describe your project..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Tech Stack
          </label>
          <input
            type="text"
            value={techStackInput}
            onChange={(e) => setTechStackInput(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="React, TypeScript, Tailwind (comma separated)"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple technologies with commas</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Deployment URL
          </label>
          <input
            type="url"
            value={deploymentUrl}
            onChange={(e) => setDeploymentUrl(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
