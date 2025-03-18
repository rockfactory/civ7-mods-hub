import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { LazyStore, Store } from '@tauri-apps/plugin-store';
import { resolve, appDataDir } from '@tauri-apps/api/path';
import { ModProfile } from '../profiles/ModProfile';

const persistStore = new LazyStore('civStorage.json', { autoSave: true });
console.log();
appDataDir().then((dir) => {
  console.log(`App Data Dir: `, dir);
});

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = (await persistStore.get(name)) || null;
    console.log(`storage.getItem`, name, value);
    return value as string;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    console.log(`storage.setItem`, name, value);
    await persistStore.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    console.log(name);
    await persistStore.delete(name);
  },
};

export type AppState = {
  modFolder: string | null;
  setModFolder: (folder: string) => void;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;

  /**
   * Array of mod IDs (modinfo_id) that are locked and cannot be uninstalled / updated.
   */
  lockedModIds?: string[];
  setModLock: (id: string, active?: boolean) => void;

  /**
   * Array of profiles that are stored
   */
  profiles?: ModProfile[];
  currentProfile?: string;
  setCurrentProfile: (profile: string) => void;
  setProfiles: (profiles: ModProfile[]) => void;
  addProfile: (profile: ModProfile) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      modFolder: null,
      setModFolder: (folder: string) => set({ modFolder: folder }),
      hydrated: false,
      setHydrated: (hydrated: boolean) => set({ hydrated }),

      lockedModIds: [],
      setModLock: (id: string, active: boolean = true) => {
        const lockedModIds = get().lockedModIds ?? [];

        if (active) {
          if (!lockedModIds.includes(id)) {
            set({ lockedModIds: [...lockedModIds, id] });
          }
        } else {
          set({ lockedModIds: lockedModIds.filter((i) => i !== id) });
        }
      },

      profiles: [],
      setProfiles: (profiles: ModProfile[]) => set({ profiles }),
      setCurrentProfile: (profile: string) => {
        set({ currentProfile: profile });
      },
      addProfile: (profile: ModProfile) => {
        set({ profiles: [...(get().profiles ?? []), profile] });
      },
    }),
    {
      name: 'civ-app-store',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage() {
        return (state) => {
          if (state) state.setHydrated(true);
        };
      },
    }
  )
);
