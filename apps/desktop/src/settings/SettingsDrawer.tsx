import {
  Button,
  Code,
  Drawer,
  Group,
  Space,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure, useToggle } from '@mantine/hooks';
import {
  IconExternalLink,
  IconFolder,
  IconLogs,
  IconRefresh,
  IconSettings,
} from '@tabler/icons-react';
import * as React from 'react';
import { useModsContext } from '../mods/ModsContext';
import { useEffect, useMemo, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { appLogDir, resolve } from '@tauri-apps/api/path';
import { getVersion } from '@tauri-apps/api/app';
import styles from './SettingsDrawer.module.css';
import { checkForAppUpdates } from './autoUpdater';

export interface ISettingsDrawerProps {}

export function SettingsDrawer(props: ISettingsDrawerProps) {
  const [opened, handlers] = useDisclosure();
  const { chooseModFolder, getModsFolder, mods } = useModsContext();

  const [displayedFolders, setDisplayedFolders] = useState<{
    mods: string | null;
    logs: string | null;
  }>({
    mods: null,
    logs: null,
  });
  useEffect(() => {
    getModsFolder().then(async (folder) => {
      setDisplayedFolders({
        mods: folder,
        logs: folder ? await resolve(folder, '..', 'Logs') : '',
      });
    });
  }, [open, getModsFolder, mods]);

  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  return (
    <>
      <Button
        color="gray"
        variant="light"
        leftSection={<IconSettings size={16} />}
        onClick={handlers.toggle}
      >
        Settings
      </Button>
      <Drawer
        title="Settings"
        position="right"
        size={400}
        opened={opened}
        onClose={handlers.close}
      >
        <Title order={3}>Civ7 Settings</Title>

        <Space h="md" />
        <Group w="100%" gap={'xs'}>
          <Button
            style={{ flex: '1 1 auto' }}
            leftSection={<IconFolder size={16} />}
            onClick={chooseModFolder}
            color="blue"
          >
            Choose mods folder
          </Button>
          <Button
            leftSection={<IconExternalLink size={16} />}
            color="blue"
            variant="light"
            onClick={() => open(displayedFolders.mods || '')}
          >
            Open
          </Button>
        </Group>
        <Text c="dimmed" size="sm" mt="xs">
          Current mods folder:
          <br />
          <Code>{displayedFolders.mods}</Code>{' '}
        </Text>

        <Title order={3} mt="lg">
          App Settings
        </Title>
        <Space h="md" />
        <Button
          onClick={() => {
            checkForAppUpdates(true).catch((err) => {
              console.error('[autoUpdater] Failed to check for updates:', err);
            });
          }}
          leftSection={<IconRefresh size={16} />}
          color="blue"
        >
          Check for CivMods updates
        </Button>

        <Title order={3} mt="lg">
          Debug
        </Title>
        <Space h="md" />
        <Stack gap="xs">
          <Button
            variant="light"
            leftSection={<IconLogs size={12} />}
            size="xs"
            color="blue"
            onClick={async () => {
              open(await appLogDir());
            }}
          >
            Open CivMods (this app) logs folder
          </Button>
          <Button
            variant="light"
            leftSection={<IconLogs size={12} />}
            size="xs"
            color="blue"
            disabled={!displayedFolders.logs}
            onClick={async () => {
              open(displayedFolders.logs || '');
            }}
          >
            Open Civilization7 logs folder
          </Button>
        </Stack>
        <div className={styles.footer}>
          <Text c="dimmed" size="sm">
            CivMods v{version} © 2025 |{' '}
            <a href="https://civmods.com" target="_blank">
              civmods.com
            </a>
          </Text>
        </div>
      </Drawer>
    </>
  );
}
