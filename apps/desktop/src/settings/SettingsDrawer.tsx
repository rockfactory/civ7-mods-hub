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
  IconBrandDiscord,
  IconBrandGithub,
  IconBrandTorchain,
  IconExternalLink,
  IconFolder,
  IconLogs,
  IconMessage,
  IconRefresh,
  IconSettings,
} from '@tabler/icons-react';
import * as React from 'react';
import { useModsContext } from '../mods/ModsContext';
import { useEffect, useMemo, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { appDataDir, appLogDir, resolve } from '@tauri-apps/api/path';
import { getVersion } from '@tauri-apps/api/app';
import styles from './SettingsDrawer.module.css';
import { checkForAppUpdates } from './autoUpdater';
import { invoke } from '@tauri-apps/api/core';

export interface ISettingsDrawerProps {}

async function redactPath(path: string | null) {
  if (!path) {
    return null;
  }
  return await invoke<string>('redact_path', { path });
}

interface DisplayedFolder {
  full: string | null;
  redacted: string | null;
}

export function SettingsDrawer(props: ISettingsDrawerProps) {
  const [opened, handlers] = useDisclosure();
  const { chooseModFolder, getModsFolder, mods } = useModsContext();

  const [displayedFolders, setDisplayedFolders] = useState<{
    mods: DisplayedFolder | null;
    logs: DisplayedFolder | null;
  }>({
    mods: null,
    logs: null,
  });
  useEffect(() => {
    async function updateFolders() {
      const modsFolder = await getModsFolder();
      const logsFolder = modsFolder
        ? await resolve(modsFolder, '..', 'Logs')
        : '';

      setDisplayedFolders({
        mods: {
          full: modsFolder,
          redacted: await redactPath(modsFolder),
        },
        logs: {
          full: logsFolder,
          redacted: await redactPath(logsFolder),
        },
      });
    }

    updateFolders().catch((err) => {
      console.error('Failed to update folders:', err);
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
            onClick={() => open(displayedFolders.mods?.full || '')}
          >
            Open
          </Button>
        </Group>
        <Text c="dimmed" size="sm" mt="xs">
          Current mods folder:
          <br />
          <Code>{displayedFolders.mods?.redacted}</Code>{' '}
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
            onClick={async () => {
              open(await appDataDir());
            }}
          >
            Open CivMods (this app) profiles folder
          </Button>
          <Button
            variant="light"
            leftSection={<IconLogs size={12} />}
            size="xs"
            color="blue"
            disabled={!displayedFolders.logs?.full}
            onClick={async () => {
              open(displayedFolders.logs?.full || '');
            }}
          >
            Open Civilization7 logs folder
          </Button>
          <Text c="dimmed" size="sm" mt="xs">
            Need help?
          </Text>
          <Group gap={0}>
            <Button
              component="a"
              size="xs"
              color="indigo"
              leftSection={<IconBrandDiscord size={16} />}
              variant="transparent"
              href="https://civmods.com/discord"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask in our Discord
            </Button>
            <Button
              component="a"
              size="xs"
              color="gray"
              leftSection={<IconMessage size={16} />}
              variant="transparent"
              href="https://forums.civfanatics.com/threads/civmods-civ7-mods-manager-discussion.696844/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask on CivFanatics
            </Button>
            <Button
              component="a"
              size="xs"
              color="gray"
              leftSection={<IconBrandGithub size={16} />}
              variant="transparent"
              href="https://github.com/rockfactory/civ7-mods-hub/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report an issue
            </Button>
          </Group>
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
