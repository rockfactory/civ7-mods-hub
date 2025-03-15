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
  Menu,
  Modal,
  Loader,
  CopyButton,
} from '@mantine/core';
import * as React from 'react';
import { ModVersionsRecord } from '../pocketbase-types';
import { ModData, ModInfo } from '../home/IModInfo';
import { open } from '@tauri-apps/plugin-shell';
import {
  IconCheck,
  IconChecklist,
  IconCircleCheckFilled,
  IconCode,
  IconCopy,
  IconDots,
  IconDownload,
  IconExternalLink,
  IconFileDescription,
  IconFolder,
  IconLink,
  IconLock,
  IconSettings,
  IconSettings2,
  IconSwitch,
  IconTransitionBottom,
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
import { isSameVersion } from './isSameVersion';
import { ModLockActionItem } from './actions/ModLockActionItem';
import { useAppStore } from '../store/store';
import { notifications } from '@mantine/notifications';

export interface IModBoxProps {
  mod: ModData;
}

export function ModBox(props: IModBoxProps) {
  const { mod } = props;
  const { local, fetched } = mod;

  const [loading, setLoading] = useState(false);

  const { install, uninstall } = useModsContext();

  const latestVersion = fetched.expand?.mod_versions_via_mod_id[0];
  const isLatest = isSameVersion(latestVersion, local);

  const isLocked = useAppStore((state) =>
    state.lockedModIds?.includes(props.mod.local?.modinfo_id ?? '')
  );

  const handleInstall = async (version: ModVersionsRecord) => {
    if (isLocked) return;

    const handleBaseInstall = async () => {
      setLoading(true);
      await install(mod, version);
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
              {mod.fetched.name}
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
    modals.openConfirmModal({
      title: 'Uninstall mod',
      children: (
        <Stack>
          <Text size="sm">
            You are about to uninstall the mod{' '}
            <Text fw={600} span>
              {mod.fetched.name}
            </Text>
            .
          </Text>
          <Text size="sm">Are you sure you want to proceed?</Text>
        </Stack>
      ),
      labels: {
        confirm: 'Uninstall',
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
    <>
      <Card
        key={fetched.id}
        className={styles.modCard}
        shadow="sm"
        p="sm"
        mb="sm"
        pos="relative"
        onClick={() => setSelected(!isSelected)}
      >
        <LoadingOverlay visible={loading} />
        <Flex justify="space-between" align="flex-start">
          <Group justify="normal" wrap="nowrap" w="100%">
            {fetched.icon_url ? (
              <Image
                width={40}
                height={40}
                style={{ borderRadius: '4px' }}
                src={fetched.icon_url}
                alt={fetched.name}
              />
            ) : (
              <div style={{ width: 40, height: 40 }}>
                <IconSettings size={40} />
              </div>
            )}
            <Flex justify="space-between" w="100%">
              <Stack gap={0} align="flex-start">
                <Text fw={600}>
                  <a
                    className={styles.plainLink}
                    href={fetched.url}
                    target="_blank"
                  >
                    {fetched.name}
                    {latestVersion?.name && (
                      <Text span c="dimmed">
                        {' '}
                        {latestVersion.name}
                      </Text>
                    )}{' '}
                    <IconExternalLink size={12} />
                  </a>
                </Text>
                <Group gap={4} align="flex-start">
                  <Text
                    c="dimmed"
                    fz={'0.85rem'}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      const modinfo_id =
                        latestVersion?.modinfo_id ?? local?.modinfo_id ?? 'N/A';
                      navigator.clipboard.writeText(modinfo_id);
                      notifications.show({
                        title: 'Mod ID copied',
                        message: modinfo_id,
                        color: 'blue',
                      });
                    }}
                  >
                    <IconCopy size={12} />{' '}
                    {latestVersion?.modinfo_id ?? local?.modinfo_id}
                  </Text>
                  <Text c="dimmed" fz={'0.85rem'}>
                    <IconUser size={12} /> {fetched.author}
                  </Text>
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
                {!isLocked && mod.local && (
                  <ActionIcon
                    mt="sm"
                    variant="light"
                    color="red"
                    onClick={() => handleUninstall()}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
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
                  <Menu.Item
                    leftSection={<IconSwitch size={16} />}
                    onClick={() => setChoosingVersion(true)}
                  >
                    Choose version...
                  </Menu.Item>
                  {local?.modinfo_path != null && (
                    <Menu.Item
                      leftSection={<IconFolder size={16} />}
                      onClick={async () =>
                        open(await resolve(local.modinfo_path!, '..'))
                      }
                    >
                      Open mod folder
                    </Menu.Item>
                  )}
                  <ModLockActionItem mod={mod} />
                </Menu.Dropdown>
              </Menu>
            </Flex>
          </Box>
        </Flex>

        <Text c="dimmed">{fetched.short_description}</Text>
      </Card>
      {isChoosingVersion && (
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
    </>
  );
}
