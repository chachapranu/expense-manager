import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'expense-manager-settings';

export interface NotificationTier {
  id: string;
  label: string;
  minAmount: number;
  enabled: boolean;
  sound: boolean;
}

const DEFAULT_TIERS: NotificationTier[] = [
  { id: 'normal', label: 'Normal', minAmount: 1000, enabled: true, sound: true },
  { id: 'high', label: 'High', minAmount: 5000, enabled: true, sound: true },
  { id: 'critical', label: 'Critical', minAmount: 25000, enabled: true, sound: true },
];

interface SettingsState {
  isDarkMode: boolean;
  isBiometricEnabled: boolean;
  isLoaded: boolean;
  notificationTiers: NotificationTier[];
  loadSettings: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  toggleBiometric: () => Promise<void>;
  setNotificationTiers: (tiers: NotificationTier[]) => Promise<void>;
  updateNotificationTier: (id: string, updates: Partial<NotificationTier>) => Promise<void>;
  addNotificationTier: (tier: NotificationTier) => Promise<void>;
  removeNotificationTier: (id: string) => Promise<void>;
}

async function persistSettings(state: { isDarkMode: boolean; isBiometricEnabled: boolean; notificationTiers: NotificationTier[] }) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isDarkMode: false,
  isBiometricEnabled: true,
  isLoaded: false,
  notificationTiers: DEFAULT_TIERS,

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set({
          isDarkMode: settings.isDarkMode ?? false,
          isBiometricEnabled: settings.isBiometricEnabled ?? true,
          notificationTiers: settings.notificationTiers ?? DEFAULT_TIERS,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleDarkMode: async () => {
    const newValue = !get().isDarkMode;
    set({ isDarkMode: newValue });
    try {
      await persistSettings({ isDarkMode: newValue, isBiometricEnabled: get().isBiometricEnabled, notificationTiers: get().notificationTiers });
    } catch {
      // Silently fail
    }
  },

  toggleBiometric: async () => {
    const newValue = !get().isBiometricEnabled;
    set({ isBiometricEnabled: newValue });
    try {
      await persistSettings({ isDarkMode: get().isDarkMode, isBiometricEnabled: newValue, notificationTiers: get().notificationTiers });
    } catch {
      // Silently fail
    }
  },

  setNotificationTiers: async (tiers) => {
    set({ notificationTiers: tiers });
    try {
      await persistSettings({ isDarkMode: get().isDarkMode, isBiometricEnabled: get().isBiometricEnabled, notificationTiers: tiers });
    } catch {
      // Silently fail
    }
  },

  updateNotificationTier: async (id, updates) => {
    const tiers = get().notificationTiers.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    set({ notificationTiers: tiers });
    try {
      await persistSettings({ isDarkMode: get().isDarkMode, isBiometricEnabled: get().isBiometricEnabled, notificationTiers: tiers });
    } catch {
      // Silently fail
    }
  },

  addNotificationTier: async (tier) => {
    const tiers = [...get().notificationTiers, tier];
    set({ notificationTiers: tiers });
    try {
      await persistSettings({ isDarkMode: get().isDarkMode, isBiometricEnabled: get().isBiometricEnabled, notificationTiers: tiers });
    } catch {
      // Silently fail
    }
  },

  removeNotificationTier: async (id) => {
    const tiers = get().notificationTiers.filter((t) => t.id !== id);
    set({ notificationTiers: tiers });
    try {
      await persistSettings({ isDarkMode: get().isDarkMode, isBiometricEnabled: get().isBiometricEnabled, notificationTiers: tiers });
    } catch {
      // Silently fail
    }
  },
}));
