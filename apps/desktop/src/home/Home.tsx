//
import {
  AppShell,
  Text,
  Checkbox,
  ScrollArea,
  Group,
  ActionIcon,
  Stack,
  TextInput,
  Box,
  Button,
  Tooltip,
  LoadingOverlay,
  SegmentedControl,
  Select,
  Space,
  Loader,
} from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import {
  IconChecks,
  IconDownload,
  IconEyeQuestion,
  IconFilterOff,
  IconFolder,
  IconRefresh,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { ModBox } from '../mods/ModBox';
import { useApplyUpdates } from '../mods/checkUpdates';
import { useModsContext } from '../mods/ModsContext';
import { SettingsDrawer } from '../settings/SettingsDrawer';
import styles from './Home.module.css';
import { useInstallDeepLink } from '../mods/deep-links/useInstallDeepLink';
import { ProfileSwitcher } from '../profiles/ProfileSwitcher';
import { cleanCategoryName } from '../mods/modCategory';
import { useModsQuery } from './ModsQuery';
import { Virtuoso } from 'react-virtuoso';
import ThrottledLoader from './ThrottledLoader';
import { isSameVersion } from '../mods/isSameVersion';
import { useAppStore } from '../store/store';
import { useCheckForAppUpdates } from '../settings/autoUpdater';

export default function ModsListPage() {
  const {
    mods,
    triggerReload,
    chooseModFolder,
    isFetching,
    isLoadingInstalled,
  } = useModsContext();

  const { query, isQueryPending, hasFilters, setQuery, resetQuery } =
    useModsQuery();

  // Globals: deep link & update
  useInstallDeepLink();
  useCheckForAppUpdates();

  const isFirstLoading =
    (isFetching || isLoadingInstalled) &&
    mods.filter((m) => m.fetched).length === 0;

  const filteredMods = useMemo(() => {
    const installedModIds = new Set(
      mods
        .filter(({ local }) => local?.modinfo_id)
        .map(({ local }) => local?.modinfo_id)
    );

    const lockedModIds = new Set(useAppStore.getState().lockedModIds);

    return mods.filter((mod) => {
      let shouldInclude = true;

      if (query.text) {
        const searchText =
          mod.name.toLocaleLowerCase() +
          ' ' +
          mod.local?.modinfo_id +
          ' ' +
          mod.fetched?.author.toLocaleLowerCase();

        shouldInclude =
          shouldInclude &&
          searchText
            .toLocaleLowerCase()
            .includes(query.text.toLocaleLowerCase());
      }

      if (query.category) {
        shouldInclude =
          shouldInclude && mod.fetched?.category === query.category;
      }

      if (query.onlyInstalled) {
        shouldInclude = shouldInclude && installedModIds.has(mod.modinfo_id);
      }

      if (query.state === 'needsUpdate') {
        shouldInclude =
          shouldInclude &&
          mod.local?.modinfo_id != null &&
          mod.fetched != null &&
          !isSameVersion(
            mod.fetched?.expand?.mod_versions_via_mod_id[0],
            mod.local
          ) &&
          !lockedModIds.has(mod.local.modinfo_id);
      } else if (query.state === 'locked') {
        shouldInclude =
          shouldInclude &&
          mod.local?.modinfo_id != null &&
          lockedModIds.has(mod.local.modinfo_id);
      } else if (query.state === 'uninstalled') {
        shouldInclude = shouldInclude && !mod.local;
      } else if (query.state === 'localOnly') {
        shouldInclude = shouldInclude && mod.isLocalOnly;
      }

      return shouldInclude;
    });
  }, [mods, query]);

  const categories = useMemo(() => {
    const categories = new Map<string, string>();
    mods.forEach((mod) => {
      if (mod.fetched?.category && !categories.has(mod.fetched.category)) {
        categories.set(
          mod.fetched.category,
          cleanCategoryName(mod.fetched.category)
        );
      }
    });

    return Array.from(categories.entries()).map(([key, value]) => ({
      value: key,
      label: value,
    }));
  }, [mods]);

  const { availableUpdates, isUpdating, applyUpdates } = useApplyUpdates();

  return (
    <AppShell
      padding="sm"
      navbar={{ width: 300, breakpoint: 'xs' }}
      header={{ height: 60 }}
    >
      <AppShell.Header p="xs" className={styles.header}>
        <Group justify="flex-start" align="center" gap={0} wrap="nowrap">
          <Group gap="sm" w={300}>
            <Text fw={700} size="xl">
              Civ7 Mod Manager
            </Text>
            <Tooltip
              label="Refresh installed mods list and check for updates"
              color="dark.8"
            >
              <ActionIcon variant="subtle" onClick={() => triggerReload()}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            <Space w={20} />
            <ThrottledLoader loading={isQueryPending || isLoadingInstalled} />
          </Group>
          <Group
            justify="space-between"
            align="center"
            gap="sm"
            flex="1 1 auto"
            wrap="nowrap"
          >
            <Group gap="sm" wrap="nowrap">
              <SegmentedControl
                value={query.onlyInstalled ? 'installed' : 'available'}
                onChange={(value) =>
                  setQuery({
                    onlyInstalled: value === 'installed',
                  })
                }
                size="sm"
                data={[
                  {
                    label: 'Installed Mods',
                    value: 'installed',
                  },
                  {
                    label: 'Available Mods',
                    value: 'available',
                  },
                ]}
              />
              <ProfileSwitcher />
            </Group>
            <Group gap="sm">
              <SettingsDrawer />
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Text fw={600} size="lg" mb="sm">
            Filter Mods
          </Text>

          <Stack>
            <TextInput
              placeholder="Search name, author..."
              value={query.text}
              onChange={(event) =>
                setQuery({ text: event.currentTarget.value })
              }
              rightSection={
                query.text ? (
                  <ActionIcon
                    variant="transparent"
                    color="gray.7"
                    onClick={() => setQuery({ text: '' })}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                ) : (
                  <IconSearch size={16} />
                )
              }
              rightSectionPointerEvents={query.text ? 'auto' : 'none'}
            />
            <Select
              placeholder="Filter by category.."
              size="sm"
              // searchable
              data={categories}
              value={query.category || null}
              clearable
              onChange={(value) => setQuery({ category: value ?? '' })}
            />
            <Select
              size="sm"
              placeholder="Filter by state..."
              value={query.state || null}
              clearable
              onChange={(value) => setQuery({ state: (value as any) ?? '' })}
              data={[
                { label: 'Needs Update', value: 'needsUpdate' },
                { label: 'Locked', value: 'locked' },
                { label: 'Not Installed', value: 'uninstalled' },
                { label: 'Local Only', value: 'localOnly' },
              ]}
            />
            {hasFilters && (
              <Button
                variant="light"
                leftSection={<IconFilterOff size={16} />}
                onClick={resetQuery}
              >
                Reset Filters
              </Button>
            )}
          </Stack>

          {/* <Button mt="md" onClick={applyFilters}>
          Apply Filters
        </Button> */}
        </AppShell.Section>
        <AppShell.Section>
          <Stack mb="md">
            {availableUpdates.length > 0 ? (
              <Tooltip
                color="dark.8"
                style={{
                  border: '1px solid rgb(66, 64, 53)',
                  borderRadius: 0,
                }}
                position="bottom-start"
                label={
                  <Stack gap={2}>
                    <Text fz="sm">Will update:</Text>
                    {availableUpdates.map((update) => (
                      <Text fz="sm" key={update.fetched.id}>
                        {update.fetched.name}:{' '}
                        {update.mod.installedVersion?.name} →{' '}
                        {update.targetVersion?.name}
                      </Text>
                    ))}
                  </Stack>
                }
              >
                <Button
                  color="blue"
                  leftSection={<IconDownload size={16} />}
                  loading={isUpdating}
                  onClick={applyUpdates}
                >
                  Update {availableUpdates.length} mods
                </Button>
              </Tooltip>
            ) : (
              <Button disabled leftSection={<IconChecks size={16} />}>
                All mods are updated
              </Button>
            )}
          </Stack>

          <Box p="sm" bg="dark.8" style={{ borderRadius: '8px' }}>
            {/* <BackgroundImage src="https://www.civfanatics.com/wp-content/uploads/2016/10/logo.png"> */}
            <Text fz="sm" c="dimmed">
              All mods are the property of their respective creators.
              <br />
              Special thanks to{' '}
              <a href="https://www.civfanatics.com/" target="_blank">
                CivFanatics
              </a>{' '}
              for hosting and supporting the modding community.
            </Text>
            {/* </BackgroundImage> */}
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main className="main">
        <LoadingOverlay visible={isFirstLoading} />
        <Virtuoso
          // Too slow
          // customScrollParent={document.body}
          useWindowScroll
          totalCount={filteredMods.length}
          itemContent={(index) => (
            <ModBox
              key={filteredMods[index].modinfo_id || index}
              mod={filteredMods[index]}
              setQuery={setQuery}
            />
          )}
        />
        {/* {filteredMods.map((mod) => (
            <ModBox key={mod.fetched.id} mod={mod} />
          ))} */}
        {filteredMods.length === 0 && (
          <Box p="lg">
            <Stack gap={'xs'} align="center">
              <IconEyeQuestion size={40} />
              <Text>No mods found</Text>
              <Text c="dimmed">
                Try changing your filters or open Settings and double check Mods
                folder
              </Text>
            </Stack>
          </Box>
        )}
      </AppShell.Main>
    </AppShell>
  );
}
