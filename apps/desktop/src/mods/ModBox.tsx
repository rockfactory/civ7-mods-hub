import {
  Card,
  Group,
  Badge,
  Button,
  Text,
  LoadingOverlay,
  Image,
  Stack,
  Box,
  Flex,
  Grid,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import * as React from 'react';
import { ModsResponse, ModVersionsRecord } from '../pocketbase-types';
import { ModInfo } from '../home/IModInfo';
import { installMod, uninstallMod } from './installMod';
import {
  IconCheck,
  IconChecklist,
  IconCircleCheckFilled,
  IconDownload,
  IconFileDescription,
  IconSettings,
  IconSettings2,
  IconTransitionBottom,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { useState } from 'react';
import { modals } from '@mantine/modals';

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

  const handleUnknownUpdate = async (mod: FetchedMod) => {
    modals.openConfirmModal({
      title: 'Update mod with unknown version',
      children: (
        <Stack>
          <Text size="sm">
            You are about to update the mod{' '}
            <Text fw={600} span>
              {mod.name}
            </Text>
            .
          </Text>
          <Text size="sm">
            The mod is already installed, but the version is unknown. Do you
            want to update to the latest version? Mod Manager will not be able
            to revert to the previous version.
          </Text>
          <Text size="sm" c="red">
            Please make sure you have a backup of the mod folder.
          </Text>
        </Stack>
      ),
      labels: {
        confirm: 'Update and overwrite',
        cancel: 'Do not update',
      },
      confirmProps: { color: 'red' },
      onConfirm: () => handleInstall(mod),
    });
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
    <Card
      key={mod.id}
      shadow="sm"
      p="sm"
      mb="sm"
      pos="relative"
      style={{
        borderRadius: 0,
        border: '1px solid rgb(66, 64, 53)',
      }}
    >
      <LoadingOverlay visible={loading} />
      <Flex justify="space-between" align="flex-start">
        <Group justify="normal" wrap="nowrap" w="100%">
          {mod.icon_url ? (
            <Image
              width={40}
              height={40}
              style={{ borderRadius: '4px' }}
              src={mod.icon_url}
              alt={mod.name}
            />
          ) : (
            <IconSettings size={40} />
          )}
          <Flex justify="space-between" w="100%">
            <Stack gap={0} align="flex-start">
              <Text fw={600}>
                {mod.name}
                {latestVersion?.name && (
                  <Text span c="dimmed">
                    {' '}
                    {latestVersion.name}
                  </Text>
                )}
              </Text>
              <Text c="dimmed" fz={'0.85rem'}>
                <IconUser size={12} /> {mod.author}
              </Text>
            </Stack>
            {/* {latestVersion && (
              <Box flex="0 0 auto">
                <Badge mt="sm" variant="outline">
                  {latestVersion.name ?? 'N/A'}
                </Badge>
              </Box>
            )} */}
          </Flex>
          {/* <Badge>{mod.rating} ★</Badge> */}
        </Group>
        <Box flex="0 0 80px" w="100%">
          <Flex align="flex-end" justify="flex-end">
            {installedModInfo ? (
              <Group gap={4} align="flex-end">
                <ActionIcon
                  mt="sm"
                  variant="light"
                  color="red"
                  onClick={() => handleUninstall(mod)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
                {isLatest ? (
                  <ActionIcon variant="filled" color="green">
                    <IconCircleCheckFilled size={16} />
                  </ActionIcon>
                ) : installedVersion ? (
                  <Tooltip
                    label={`Update to ${
                      latestVersion?.name ?? 'latest'
                    }, installed ${installedVersion.name}`}
                  >
                    <ActionIcon
                      variant="filled"
                      color="blue"
                      onClick={() => handleInstall(mod, true)}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Tooltip label="Install latest version, current version unknown">
                    <ActionIcon
                      color="grape"
                      onClick={() => handleUnknownUpdate(mod)}
                    >
                      <IconTransitionBottom size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            ) : (
              <ActionIcon
                mt="md"
                variant="light"
                onClick={() => handleInstall(mod)}
              >
                <IconDownload size={16} />
              </ActionIcon>
            )}
          </Flex>
        </Box>
      </Flex>

      <Text c="dimmed">
        {/* <IconUser size={12} /> {mod.author}{' '} */}
        {mod.short_description}
      </Text>
    </Card>
  );
}
