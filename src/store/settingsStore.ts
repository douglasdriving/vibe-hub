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
  selectDirectory: () => Promise<string | null>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
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
    const { settings } = useSettingsStore.getState();

    // If no settings exist, create new one
    const currentSettings = settings || { projectsDirectory: '', soundEffectsEnabled: true, launchOnStartup: false };

    try {
      const newSettings = { ...currentSettings, projectsDirectory: path };
      await tauri.updateSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      throw error;
    }
  },

  // Update sound effects enabled
  updateSoundEffectsEnabled: async (enabled: boolean) => {
    const { settings } = useSettingsStore.getState();
    const currentSettings = settings || { projectsDirectory: '', soundEffectsEnabled: true, launchOnStartup: false };

    try {
      const newSettings = { ...currentSettings, soundEffectsEnabled: enabled };
      await tauri.updateSettings(newSettings);
      soundEffects.setEnabled(enabled);
      set({ settings: newSettings });
    } catch (error) {
      throw error;
    }
  },

  // Update launch on startup
  updateLaunchOnStartup: async (enabled: boolean) => {
    const { settings } = useSettingsStore.getState();
    const currentSettings = settings || { projectsDirectory: '', soundEffectsEnabled: true, launchOnStartup: false };

    try {
      // Enable or disable autostart
      if (enabled) {
        await tauri.enableAutostart();
      } else {
        await tauri.disableAutostart();
      }

      // Update settings
      const newSettings = { ...currentSettings, launchOnStartup: enabled };
      await tauri.updateSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      throw error;
    }
  },

  // Open directory picker
  selectDirectory: async () => {
    try {
      const path = await tauri.selectDirectory();
      if (path) {
        await useSettingsStore.getState().updateProjectsDirectory(path);
      }
      return path;
    } catch (error) {
      throw error;
    }
  },
}));
