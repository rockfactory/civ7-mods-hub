import {
  Card,
  Group,
  Badge,
  Button,
  Text,
  LoadingOverlay,
  Image,
  Stack,
} from '@mantine/core';
import * as React from 'react';
import { ModsResponse, ModVersionsRecord } from '../pocketbase-types';
import { ModInfo } from '../home/IModInfo';
import { installMod, uninstallMod } from './installMod';
import {
  IconCheck,
  IconChecklist,
  IconDownload,
  IconFileDescription,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { useState } from 'react';

export interface IModBoxProps {
  mod: FetchedMod;
  modsInfo: ModInfo[];
  onActionComplete?: () => void;
}

export type FetchedMod = ModsResponse<{
  mod_versions_via_mod_id: ModVersionsRecord[];
}>;

export function ModBox(props: IModBoxProps) {
  const { mod, modsInfo } = props;

  const [loading, setLoading] = useState(false);

  const installedModInfo = modsInfo.find(
    (info) =>
      info.modinfo_id === mod.expand?.mod_versions_via_mod_id[0].modinfo_id
  );

  const isLatest =
    installedModInfo?.folder_hash ===
    mod.expand?.mod_versions_via_mod_id[0].hash;

  const latestVersion = mod.expand?.mod_versions_via_mod_id[0];
  const installedVersion = mod.expand?.mod_versions_via_mod_id.find(
    (version) => version.hash === installedModInfo?.folder_hash
  );

  const handleInstall = async (mod: FetchedMod, update: boolean = false) => {
    const version = mod.expand?.mod_versions_via_mod_id[0];
    if (!version?.download_url) {
      throw new Error(`Mod ${mod.id} has no download URL`);
    }

    try {
      setLoading(true);
      if (update) {
        await uninstallMod(installedModInfo!);
      }
      await installMod(version);
      props.onActionComplete?.();
    } catch (error) {
      console.error('Failed to install mod:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (mod: FetchedMod) => {
    console.log('Uninstalling mod:', mod);
    try {
      setLoading(true);
      await uninstallMod(installedModInfo!);
      props.onActionComplete?.();
    } catch (error) {
      console.error('Failed to uninstall mod:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card key={mod.id} shadow="sm" p="lg" mb="md" pos="relative">
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" wrap="nowrap">
        <Image width={40} height={40} src={mod.icon_url} alt={mod.name} />
        <Stack gap="xs" align="flex-start">
          <Text fw={600}>{mod.name}</Text>
          <Text mt="xs" c="dimmed">
            <IconUser size={12} /> {mod.author}{' '}
            <IconFileDescription size={12} /> {mod.short_description}
          </Text>
          {latestVersion && (
            <Badge mt="sm" variant="outline">
              {latestVersion.name ?? 'N/A'}
            </Badge>
          )}
        </Stack>
        {/* <Badge>{mod.rating} ★</Badge> */}
      </Group>

      {installedModInfo ? (
        <Group grow>
          {isLatest ? (
            <Button
              leftSection={<IconChecklist size={16} />}
              mt="sm"
              variant="filled"
              color="green"
            >
              Installed
            </Button>
          ) : (
            <Button
              leftSection={<IconDownload size={16} />}
              mt="sm"
              variant="filled"
              color="blue"
              onClick={() => handleInstall(mod, true)}
            >
              Update from {installedVersion?.name ?? 'previous'}
            </Button>
          )}
          <Button
            leftSection={<IconTrash size={16} />}
            mt="sm"
            variant="light"
            color="red"
            onClick={() => handleUninstall(mod)}
          >
            Uninstall
          </Button>
        </Group>
      ) : (
        <Button
          leftSection={<IconDownload size={16} />}
          mt="md"
          variant="light"
          onClick={() => handleInstall(mod)}
        >
          Install
        </Button>
      )}
    </Card>
  );
}
