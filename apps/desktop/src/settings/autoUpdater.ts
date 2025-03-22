import { check } from '@tauri-apps/plugin-updater';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
import { useEffect } from 'react';

let isAskingUserForUpdateConfirmation = false;
let shouldRemindLater = true;

export async function checkForAppUpdates(onUserClick: boolean) {
  const update = await check();

  if (!update) {
    console.log('No update available');
    if (onUserClick) {
      await message('You are on the latest version. Stay awesome!', {
        title: 'No Update Available',
        kind: 'info',
        okLabel: 'OK',
      });
    }

    return;
  }

  if (update.available) {
    const yes = await ask(
      `Update to ${update.version} is available!\n\nRelease notes: ${update.body}`,
      {
        title: 'Update Available',
        kind: 'info',
        okLabel: 'Update and Relaunch',
        cancelLabel: 'Cancel',
      }
    );
    if (yes) {
      await update.downloadAndInstall();
      // Restart the app after the update is installed by calling the Tauri command that handles restart for your app
      // It is good practice to shut down any background processes gracefully before restarting
      // As an alternative, you could ask the user to restart the app manually
      await relaunch();
    } else {
      shouldRemindLater = false;
    }
  }
}

/**
 * Each 20 minutes check for updates
 */
export function useCheckForAppUpdates() {
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAskingUserForUpdateConfirmation || !shouldRemindLater) {
        return;
      }
      isAskingUserForUpdateConfirmation = true;
      console.log('[autoUpdater] Checking for updates...');
      checkForAppUpdates(false)
        .catch((err) => {
          console.error('[autoUpdater] Failed to check for updates:', err);
        })
        .finally(() => {
          isAskingUserForUpdateConfirmation = false;
        });
    }, 20 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
