import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { LazyStore, Store } from '@tauri-apps/plugin-store';
import { resolve, appDataDir } from '@tauri-apps/api/path';

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
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      modFolder: null,
      setModFolder: (folder: string) => set({ modFolder: folder }),
      hydrated: false,
      setHydrated: (hydrated: boolean) => set({ hydrated }),
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
