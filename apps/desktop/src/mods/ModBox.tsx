import {
  Card,
  Group,
  Text,
  LoadingOverlay,
  Stack,
  Box,
  Flex,
  ActionIcon,
  Tooltip,
  Menu,
  Modal,
  Alert,
} from '@mantine/core';
import * as React from 'react';
import type { ModVersionsRecord } from '@civmods/parser';
import {
  FetchedModule,
  FetchedVersion,
  ModData,
  ModInfo,
} from '../home/IModInfo';
import { open } from '@tauri-apps/plugin-shell';
import {
  IconAlertCircle,
  IconCopy,
  IconDeviceFloppy,
  IconDots,
  IconDownload,
  IconExternalLink,
  IconFolder,
  IconHexagonPlus,
  IconLock,
  IconStar,
  IconSwitch,
  IconTag,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { useState } from 'react';
import { modals } from '@mantine/modals';
import styles from './ModBox.module.css';
import { ModBoxVersions } from './ModBoxVersions';
import { useModsContext } from './ModsContext';
import { resolve } from '@tauri-apps/api/path';
import { ModInstallButton } from './ModInstallButton';
import { ModLockActionItem } from './actions/ModLockActionItem';
import { useAppStore } from '../store/store';
import { notifications } from '@mantine/notifications';
import { cleanCategoryName } from './modCategory';
import { SetModsQueryFn } from '../home/ModsQuery';
import { ModIcon } from './components/ModIcon';
import { ModSmallRow } from './components/ModSmallRow';
import { getInstalledDependedBy } from './dependencies/getInstalledDependsOn';
import { ModUnsatisfiedDependenciesRow } from './components/ModUnsatisfiedDependenciesRow';
import { useIsModLocked } from './actions/useIsModLocked';
import { InstallModOptions } from './installMod';

export interface IModBoxProps {
  mod: ModData;
  setQuery: SetModsQueryFn;
}

export function ModBox(props: IModBoxProps) {
  const { mod, setQuery } = props;
  const { locals, fetched } = mod;

  const [loading, setLoading] = useState(false);

  const { install, uninstall, mods } = useModsContext();

  const latestVersion = mod.fetched?.versions[0];
  const isLatest =
    latestVersion && latestVersion.id === mod.installedVersion?.id;

  const isLocked = useIsModLocked(mod.modinfoIds);

  const handleInstall = async (
    version: FetchedVersion,
    options: InstallModOptions = {}
  ) => {
    if (isLocked) return;

    const handleBaseInstall = async () => {
      setLoading(true);
      await install(mod, version, options);
      setLoading(false);
    };

    // When the version is known, we can just install it
    if (!mod.isUnknown) {
      await handleBaseInstall();
      return;
    }

    modals.openConfirmModal({
      title: 'Update mod with unknown version',
      children: (
        <Stack>
          <Text size="sm">
            You are about to update the mod{' '}
            <Text fw={600} span>
              {mod.fetched?.name}
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
      onConfirm: () => handleBaseInstall(),
    });
  };

  const handleUninstall = async () => {
    if (isLocked) return;
    const installedDependedBy = getInstalledDependedBy(mod, mods);

    modals.openConfirmModal({
      title: 'Uninstall mod',
      children: (
        <Stack>
          <Text size="sm">
            You are about to uninstall the mod{' '}
            <Text fw={600} span>
              {mod.name}
            </Text>
            .
          </Text>
          <Text size="sm">Are you sure you want to proceed?</Text>
          {mod.isLocalOnly && (
            <Text size="sm" c="red">
              This mod is not available in the mod repository. Uninstalling it
              will remove all the files from the disk.
            </Text>
          )}
          {installedDependedBy.length > 0 && (
            <Alert
              variant="light"
              color="red"
              title="This mod is a dependency"
              icon={<IconAlertCircle size={24} />}
            >
              This mod is used by other mods. Uninstalling it may break them.
              <Stack gap={'xs'} mt="xs">
                {installedDependedBy.map((dep) => (
                  <ModSmallRow key={dep.id} mod={dep} />
                ))}
              </Stack>
            </Alert>
          )}
        </Stack>
      ),
      labels: {
        confirm: mod.isLocalOnly ? 'Remove from disk' : 'Uninstall',
        cancel: 'Cancel',
      },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setLoading(true);
        await uninstall(mod);
        setLoading(false);
      },
    });
  };

  const [isSelected, setSelected] = useState(false);
  const [isChoosingVersion, setChoosingVersion] = useState(false);

  return (
    <Box pb="sm">
      <Card
        key={mod.id}
        className={styles.modCard}
        shadow="sm"
        p="sm"
        pos="relative"
        onClick={() => setSelected(!isSelected)}
      >
        <LoadingOverlay visible={loading} />
        <Flex justify="space-between" align="flex-start">
          <Group justify="normal" wrap="nowrap" w="100%">
            <ModIcon mod={mod} width={40} />
            <Flex justify="space-between" w="100%">
              <Stack gap={0} align="flex-start" w="100%">
                <Text fw={600}>
                  {fetched ? (
                    <a
                      className={styles.plainLink}
                      href={fetched?.url}
                      target="_blank"
                    >
                      {fetched.name}
                      {latestVersion?.name && (
                        <Text span c="dimmed">
                          {' '}
                          {latestVersion.name}
                        </Text>
                      )}{' '}
                      {/* <Text span c="gray" fz="0.85rem">
                        CivFanatics
                      </Text> */}
                      <IconExternalLink size={12} />
                    </a>
                  ) : (
                    mod.name
                  )}
                </Text>
                <Group gap={2} justify="space-between" w={'100%'}>
                  <Group gap={4} align="flex-start">
                    <Text
                      c="dimmed"
                      className={styles.textAction}
                      onClick={(e) => {
                        // TODO This is only the first modinfo_id;
                        const modinfo_id =
                          latestVersion?.modinfo_id ??
                          locals?.[0].modinfo.modinfo_id ??
                          'N/A';
                        navigator.clipboard.writeText(modinfo_id);
                        notifications.show({
                          title: 'Mod ID copied',
                          message: modinfo_id,
                          color: 'blue',
                        });
                      }}
                    >
                      <IconCopy size={12} />{' '}
                      {latestVersion?.modinfo_id ??
                        locals?.[0]?.modinfo.modinfo_id}
                    </Text>
                    {fetched && (
                      <Text
                        c="dimmed"
                        className={styles.textAction}
                        onClick={() => {
                          setQuery({ text: fetched.author });
                        }}
                      >
                        <IconUser size={12} /> {fetched.author}
                      </Text>
                    )}
                    {mod.fetched?.category && (
                      <Text
                        c="dimmed"
                        className={styles.textAction}
                        onClick={() => {
                          setQuery({ category: mod.fetched!.category });
                        }}
                      >
                        <IconTag size={12} />{' '}
                        {cleanCategoryName(mod.fetched.category)}
                      </Text>
                    )}
                    {/**
                     * TODO Support submods
                     */}
                    {latestVersion?.affect_saves && (
                      <Tooltip
                        color="dark.8"
                        multiline
                        w={320}
                        label="This mod affects save files: it means that you shouldn't remove it in the middle of the game."
                      >
                        <Text
                          c="orange.1"
                          fz={'0.85rem'}
                          className={styles.descriptionBlock}
                        >
                          <IconDeviceFloppy size={12} /> Save file
                        </Text>
                      </Tooltip>
                    )}
                  </Group>
                  <Group gap={4} align="flex-start" mr="md">
                    {mod.fetched?.downloads_count && (
                      <Text c="dimmed" className={styles.textStatic}>
                        <IconDownload size={12} /> {mod.fetched.downloads_count}
                      </Text>
                    )}
                    {mod.fetched?.rating && (
                      <Text c="dimmed" className={styles.textStatic}>
                        <IconStar size={12} /> {mod.fetched.rating}
                      </Text>
                    )}
                  </Group>
                </Group>
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
          <Box flex="0 0 100px" w="100%">
            <Flex align="flex-end" justify="flex-end">
              <Group gap={4} align="flex-end">
                {!isLocked && mod.locals.length > 0 && (
                  <Tooltip
                    color="dark.8"
                    label={
                      mod.isLocalOnly ? 'Remove folder from disk' : 'Uninstall'
                    }
                  >
                    <ActionIcon
                      mt="sm"
                      variant={'light'}
                      color="red"
                      onClick={() => handleUninstall()}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
                {isLocked && (
                  <Tooltip
                    color="dark.8"
                    label="Mod is locked. No updates will be applied. Open the three dots menu to unlock."
                  >
                    <ActionIcon color="pink">
                      <IconLock size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
                {!isLocked && (
                  <ModInstallButton
                    mod={mod}
                    isTargetLatest
                    version={latestVersion}
                    onInstall={handleInstall}
                  />
                )}
              </Group>
              <Menu
                shadow="md"
                width={200}
                position="bottom-end"
                trigger={'click-hover'}
              >
                <Menu.Target>
                  <ActionIcon ml={4} mt="sm" variant="light" color="gray">
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Mod Actions</Menu.Label>
                  {!isLocked && mod.fetched && (
                    <Menu.Item
                      leftSection={<IconSwitch size={16} />}
                      onClick={() => setChoosingVersion(true)}
                    >
                      Choose version...
                    </Menu.Item>
                  )}
                  {locals?.[0].modinfo.modinfo_path != null && (
                    <Menu.Item
                      leftSection={<IconFolder size={16} />}
                      onClick={async () =>
                        open(
                          await resolve(locals?.[0].modinfo.modinfo_path!, '..')
                        )
                      }
                    >
                      Open mod folder
                    </Menu.Item>
                  )}
                  {mod.fetched && (
                    <Menu.Item
                      leftSection={<IconExternalLink size={16} />}
                      onClick={() => open(mod.fetched!.url)}
                    >
                      See on CivFanatics
                    </Menu.Item>
                  )}
                  {mod.fetched && (
                    <Menu.Item
                      leftSection={<IconHexagonPlus size={16} />}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://civmods.com/install?modId=${encodeURIComponent(
                            mod.fetched!.id
                          )}&instant=false`
                        );
                        notifications.show({
                          title: 'Mod installation link copied',
                          message: `Link for mod ${mod.name} copied to clipboard`,
                          color: 'blue',
                        });
                      }}
                    >
                      Copy install link
                    </Menu.Item>
                  )}
                  <ModLockActionItem mod={mod} />
                </Menu.Dropdown>
              </Menu>
            </Flex>
          </Box>
        </Flex>

        <Text c="dimmed">{fetched?.short_description ?? ''}</Text>
        <ModUnsatisfiedDependenciesRow mod={mod} setLoading={setLoading} />
      </Card>
      {isChoosingVersion && fetched && (
        <Modal
          opened={isChoosingVersion}
          size="lg"
          title="Choose version"
          onClose={() => setChoosingVersion(false)}
          zIndex={1200}
        >
          <Text size="sm">
            Choose version of the mod{' '}
            <Text fw={600} span>
              {fetched.name}
            </Text>
            .
          </Text>
          <ModBoxVersions
            mod={mod}
            onInstall={handleInstall}
            loading={loading}
          />
        </Modal>
      )}
    </Box>
  );
}
