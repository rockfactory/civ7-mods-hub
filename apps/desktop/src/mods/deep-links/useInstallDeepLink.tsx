import { useEffect } from 'react';
import { DeepLinkActivations, useDeepLinkActivation } from './registerDeepLink';
import { useModsContext } from '../ModsContext';
import { openConfirmModal, openModal } from '@mantine/modals';
import { Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUser } from '@tabler/icons-react';

export function useInstallDeepLink() {
  const { mods, install } = useModsContext();
  const changedDeepLink = useDeepLinkActivation();

  useEffect(() => {
    // Wait for mods to load
    if (mods.length === 0) {
      return;
    }

    const deepLink = DeepLinkActivations.shift();
    if (!deepLink) {
      console.log('No deep link found');
      return;
    }

    console.log('[deeplink] Found deep link:', deepLink.url);

    const params = new URLSearchParams(deepLink.url.split('?').pop());
    const modUrl = params.get('modUrl');
    const modCfId = params.get('modCfId');
    const modId = params.get('modId');

    const mod = mods.find((mod) => {
      if (modUrl) {
        return mod.fetched.url.startsWith(modUrl);
      }
      if (modCfId) {
        return mod.fetched.cf_id == modCfId;
      }
      if (modId) {
        return mod.fetched.id == modId;
      }
      return false;
    });

    const latestVersion = mod?.fetched.expand?.mod_versions_via_mod_id[0];

    if (!mod || !latestVersion) {
      console.warn(
        'Mod not found in the list of available mods',
        mod?.fetched?.name,
        deepLink.url
      );
      openModal({
        title: 'Mod not found',
        children: 'Mod not found in the list of available mods',
      });
      return;
    }

    console.log('[deeplink] Found mod:', mod.fetched.name);
    openConfirmModal({
      title: 'Install Mod',
      closeOnClickOutside: false,
      children: (
        <Stack>
          <Text size="sm">
            Do you want to install mod{' '}
            <Text span fw={600}>
              {mod.fetched.name}
            </Text>{' '}
            version{' '}
            <Text span fw={600}>
              {latestVersion.name ?? 'latest'}
            </Text>
            ?
          </Text>
          {mod.local && mod.local.modinfo_id && (
            <Text size="sm">
              Already installed:{' '}
              {mod.installedVersion?.name ?? 'unknown version'}
            </Text>
          )}
          <Text size="sm">
            <IconUser size={16} /> {mod.fetched.author}
          </Text>
          <Text size="sm">
            Description:{' '}
            <Text span c="dimmed">
              {mod.fetched.short_description}
            </Text>
          </Text>
        </Stack>
      ),
      labels: {
        cancel: 'Cancel',
        confirm: 'Install',
      },
      onConfirm: async () => {
        const loadingNotification = notifications.show({
          title: 'Installing mod',
          message: `Downloading and installing ${mod.fetched.name}`,
          loading: true,
          autoClose: false,
        });
        try {
          await install(mod, latestVersion);
        } finally {
          notifications.hide(loadingNotification);
        }
      },
    });
  }, [mods, install, changedDeepLink]);
}
