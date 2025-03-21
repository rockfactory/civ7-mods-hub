import { kebabCase } from 'es-toolkit';
import { getActiveModsFolder } from '../../mods/getModsFolder';
import { ModProfile } from '../ModProfile';
import { useAppStore } from '../../store/store';
import { copyModsToProfile } from '../profileRustBindings';

export interface CreateNewProfileOptions {
  title: string;
  /**
   * If true, will keep the existing mods in the new profile:
   * basically, it will duplicate the current profile, backing up the mods.
   */
  shouldDuplicate?: boolean;
}

/**
 * Creates a new profile with the given title, starting from
 * the current active mods folder (current profile).
 * Switches automatically to the new profile.
 */
export async function createNewProfile(
  options: CreateNewProfileOptions
): Promise<ModProfile> {
  const { title, shouldDuplicate } = options;

  const modsFolder = await getActiveModsFolder();
  if (modsFolder == null) {
    throw new Error('Failed to get active mods folder');
  }

  const appState = useAppStore.getState();

  // If the profile name clashes with an existing one, show error
  const newFolderName = kebabCase(title.replace(/[^\w\s]/gi, '').trim());
  const existing = appState.profiles?.find(
    (p) => p.folderName === newFolderName
  );
  if (existing) {
    throw new Error(
      `Cannot create profile "${title}", found folder with similar name "${newFolderName}"`
    );
  }
  if (newFolderName === '') {
    throw new Error('Invalid profile name');
  }

  // Checks current profile: since we need to backup it to make place for the new one,
  // we need to ensure we have a valid folder name.
  const currentProfile = appState.profiles?.find(
    (p) => p.folderName === appState.currentProfile
  );
  if (!currentProfile) {
    throw new Error('No current profile found');
  }

  // Backup the current profile in its own folder
  console.log('Backing up current profile:', currentProfile.folderName);
  const lockedIds = useAppStore.getState().lockedModIds ?? [];
  await copyModsToProfile(
    modsFolder,
    lockedIds,
    currentProfile.folderName,
    // If we're duplicating, we don't want to cleanup the Mods folder
    !shouldDuplicate
  );

  // Save the new profile in the store
  const newProfile: ModProfile = {
    folderName: newFolderName,
    title,
  };

  useAppStore.getState().addProfile(newProfile);
  useAppStore.getState().setCurrentProfile(newFolderName);

  return newProfile;
}
