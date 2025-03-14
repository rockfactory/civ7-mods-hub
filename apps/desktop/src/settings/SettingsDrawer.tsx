import { Button, Code, Drawer, Space, Text, Title } from '@mantine/core';
import { useDisclosure, useToggle } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import * as React from 'react';
import { useModsContext } from '../mods/ModsContext';
import { useEffect, useMemo, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { appLogDir } from '@tauri-apps/api/path';

export interface ISettingsDrawerProps {}

export function SettingsDrawer(props: ISettingsDrawerProps) {
  const [opened, handlers] = useDisclosure();
  const { chooseModFolder, getModsFolder, mods } = useModsContext();

  const [displayedFolder, setDisplayedFolder] = useState<string | null>(null);
  useEffect(() => {
    getModsFolder().then((folder) => {
      setDisplayedFolder(folder);
    });
  }, [open, getModsFolder, mods]);

  return (
    <>
      <Button
        color="gray"
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
        <Button onClick={chooseModFolder} color="blue">
          Choose mods folder
        </Button>
        <Text c="dimmed" size="sm" mt="xs">
          Current mods folder:
          <br />
          <Code>{displayedFolder}</Code>
        </Text>

        <Title order={3} mt="lg">
          Debug
        </Title>
        <Space h="md" />
        <Button
          variant="outline"
          color="blue"
          onClick={async () => {
            open(await appLogDir());
          }}
        >
          Open CivMods logs folder
        </Button>
      </Drawer>
    </>
  );
}
