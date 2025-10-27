import { useEffect, useState } from 'react';
import { Terminal, Circle, ExternalLink } from 'lucide-react';
import { Button } from '../common/Button';
import * as tauri from '../../services/tauri';

interface ClaudeSessionPanelProps {
  projectPath: string;
  textColor?: string;
  bgColor?: string;
}

export function ClaudeSessionPanel({ projectPath, textColor = '#FFFFFF', bgColor }: ClaudeSessionPanelProps) {
  const [sessionStatus, setSessionStatus] = useState<tauri.SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessionStatus();

    // Poll for session status every 5 seconds
    const interval = setInterval(() => {
      loadSessionStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [projectPath]);

  const loadSessionStatus = async () => {
    try {
      const status = await tauri.getSessionStatus(projectPath);
      setSessionStatus(status);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to get session status:', error);
      setIsLoading(false);
    }
  };

  const handleFocusTerminal = async () => {
    try {
      await tauri.focusClaudeTerminal(projectPath);
    } catch (error) {
      console.error('Failed to focus terminal:', error);
      alert('Could not focus Claude terminal. The window may have been closed.');
    }
  };

  if (isLoading || !sessionStatus) {
    return null;
  }

  const statusColors = {
    running: 'bg-green-500',
    idle: 'bg-yellow-500',
    not_started: 'bg-gray-500'
  };

  const statusLabels = {
    running: 'Running',
    idle: 'Idle',
    not_started: 'Not Started'
  };

  return (
    <div
      className="border-4 border-black rounded-lg p-4 mb-6 bg-opacity-20"
      style={{ backgroundColor: bgColor || 'rgba(0, 0, 0, 0.2)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={24} style={{ color: textColor }} />
          <div>
            <h3 className="font-bold text-lg" style={{ color: textColor }}>
              Claude Session
            </h3>
            <div className="flex items-center gap-2">
              <Circle
                size={12}
                className={`${statusColors[sessionStatus.status]} fill-current`}
              />
              <span className="text-sm" style={{ color: textColor, opacity: 0.9 }}>
                {statusLabels[sessionStatus.status]}
              </span>
            </div>
          </div>
        </div>

        {sessionStatus.status === 'running' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFocusTerminal}
            invertedBgColor={textColor}
            invertedTextColor={bgColor}
          >
            <ExternalLink size={16} className="inline mr-2" />
            Focus Terminal
          </Button>
        )}
      </div>
    </div>
  );
}
