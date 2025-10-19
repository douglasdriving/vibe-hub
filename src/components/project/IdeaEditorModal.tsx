import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface IdeaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: IdeaFormData) => Promise<void>;
  onUpdateDraft: (idea: IdeaFormData) => void;
  projectName: string;
  draftData: IdeaFormData | null;
}

export interface IdeaFormData {
  summary: string;
  problem: string;
  coreFunctionality: string;
  valueProposition: string;
  additionalRequirements: string;
}

export function IdeaEditorModal({ isOpen, onClose, onSave, onUpdateDraft, projectName, draftData }: IdeaEditorModalProps) {
  const [summary, setSummary] = useState(draftData?.summary || '');
  const [problem, setProblem] = useState(draftData?.problem || '');
  const [coreFunctionality, setCoreFunctionality] = useState(draftData?.coreFunctionality || '');
  const [valueProposition, setValueProposition] = useState(draftData?.valueProposition || '');
  const [additionalRequirements, setAdditionalRequirements] = useState(draftData?.additionalRequirements || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update form state when draftData changes (when modal reopens with saved draft)
  useEffect(() => {
    if (isOpen && draftData) {
      setSummary(draftData.summary || '');
      setProblem(draftData.problem || '');
      setCoreFunctionality(draftData.coreFunctionality || '');
      setValueProposition(draftData.valueProposition || '');
      setAdditionalRequirements(draftData.additionalRequirements || '');
    }
  }, [isOpen, draftData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!summary.trim()) {
      setError('Summary is required');
      return;
    }

    if (!problem.trim()) {
      setError('Problem description is required');
      return;
    }

    if (!coreFunctionality.trim()) {
      setError('Core functionality description is required');
      return;
    }

    if (!valueProposition.trim()) {
      setError('Value proposition is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave({
        summary: summary.trim(),
        problem: problem.trim(),
        coreFunctionality: coreFunctionality.trim(),
        valueProposition: valueProposition.trim(),
        additionalRequirements: additionalRequirements.trim(),
      });

      // Reset form and clear draft
      setSummary('');
      setProblem('');
      setCoreFunctionality('');
      setValueProposition('');
      setAdditionalRequirements('');
      onUpdateDraft({
        summary: '',
        problem: '',
        coreFunctionality: '',
        valueProposition: '',
        additionalRequirements: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project idea');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      // Save current form state as draft before closing
      onUpdateDraft({
        summary: summary.trim(),
        problem: problem.trim(),
        coreFunctionality: coreFunctionality.trim(),
        valueProposition: valueProposition.trim(),
        additionalRequirements: additionalRequirements.trim(),
      });
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Write Project Pitch: ${projectName}`}>
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        {/* Summary */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            One-Sentence Summary *
          </label>
          <input
            autoFocus
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isSaving}
            className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="A desktop app for managing personal vibe-coding projects"
          />
        </div>

        {/* Problem */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Core Problem *
          </label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            disabled={isSaving}
            rows={4}
            className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            placeholder="Describe the core problem this project solves..."
          />
        </div>

        {/* Core Functionality */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Core Functionality *
          </label>
          <textarea
            value={coreFunctionality}
            onChange={(e) => setCoreFunctionality(e.target.value)}
            disabled={isSaving}
            rows={8}
            className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            placeholder="Describe how the app should work and what the core functionality is..."
          />
        </div>

        {/* Value Proposition */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Value Proposition *
          </label>
          <textarea
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            disabled={isSaving}
            rows={3}
            className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            placeholder="What value does this provide to users?"
          />
        </div>

        {/* Additional Requirements */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Additional Requirements
            <span className="text-gray-500 font-normal ml-1">(Optional)</span>
          </label>
          <textarea
            value={additionalRequirements}
            onChange={(e) => setAdditionalRequirements(e.target.value)}
            disabled={isSaving}
            rows={3}
            className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            placeholder="Any additional requirements or constraints..."
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ idea.md file will be generated in .vibe folder</li>
            <li>✓ Project status will advance to "Idea"</li>
            <li>✓ Ready to generate design spec with Claude!</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Project Pitch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
