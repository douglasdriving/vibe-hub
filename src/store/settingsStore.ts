import { create } from 'zustand';
import type { Settings } from './types';
import * as tauri from '../services/tauri';
import { soundEffects } from '../utils/sounds';

interface SettingsStore {
  // State
  settings: Settings | null;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateProjectsDirectory: (path: string) => Promise<void>;
  updateSoundEffectsEnabled: (enabled: boolean) => Promise<void>;
  updateLaunchOnStartup: (enabled: boolean) => Promise<void>;
  updateAutoRefineOnStartup: (enabled: boolean) => Promise<void>;
  selectDirectory: () => Promise<string | null>;
}

// Default settings fallback
const DEFAULT_SETTINGS: Settings = {
  projectsDirectory: '',
  soundEffectsEnabled: true,
  launchOnStartup: false,
  autoRefineOnStartup: false,
  githubIntegrationEnabled: false
};

export const useSettingsStore = create<SettingsStore>((set, get) => {
  // Helper function to update a setting
  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K],
    beforeUpdate?: () => Promise<void>
  ) => {
    const { settings } = get();
    const currentSettings = settings || DEFAULT_SETTINGS;

    try {
      // Run optional pre-update hook
      if (beforeUpdate) {
        await beforeUpdate();
      }

      const newSettings = { ...currentSettings, [key]: value };
      await tauri.updateSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      throw error;
    }
  };

  return {
    // Initial state
    settings: null,
    isLoading: false,

    // Load settings from backend
    loadSettings: async () => {
      set({ isLoading: true });
      try {
        const settings = await tauri.getSettings();

        // Apply sound effects setting
        soundEffects.setEnabled(settings.soundEffectsEnabled ?? true);

        set({ settings, isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    // Update projects directory
    updateProjectsDirectory: async (path: string) => {
      await updateSetting('projectsDirectory', path);
    },

    // Update sound effects enabled
    updateSoundEffectsEnabled: async (enabled: boolean) => {
      await updateSetting('soundEffectsEnabled', enabled);
      soundEffects.setEnabled(enabled);
    },

    // Update launch on startup
    updateLaunchOnStartup: async (enabled: boolean) => {
      await updateSetting('launchOnStartup', enabled, async () => {
        // Enable or disable autostart before updating settings
        if (enabled) {
          await tauri.enableAutostart();
        } else {
          await tauri.disableAutostart();
        }
      });
    },

    // Update auto-refine on startup
    updateAutoRefineOnStartup: async (enabled: boolean) => {
      await updateSetting('autoRefineOnStartup', enabled);
    },

    // Open directory picker
    selectDirectory: async () => {
      try {
        const path = await tauri.selectDirectory();
        if (path) {
          await get().updateProjectsDirectory(path);
        }
        return path;
      } catch (error) {
        throw error;
      }
    },
  };
});
