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
  MultiSelect,
} from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import {
  IconChecks,
  IconDownload,
  IconEyeQuestion,
  IconFilterOff,
  IconFolder,
  IconMenuOrder,
  IconRefresh,
  IconSearch,
  IconSortAZ,
  IconSortDescending,
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
import { useCheckForGlobalUpdates } from '../settings/autoUpdater';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

export default function ModsListPage() {
  const {
    mods,
    triggerReload,
    chooseModFolder,
    isFetching,
    isLoadingInstalled,
  } = useModsContext();

  const {
    query,
    isQueryPending,
    hasFilters,
    setQuery,
    resetQuery,
    sort,
    setSort,
  } = useModsQuery();

  // Globals: deep link & update
  useInstallDeepLink();
  useCheckForGlobalUpdates();

  const isFirstLoading = useMemo(() => {
    console.log('isFirstLoading', {
      isFetching,
      isLoadingInstalled,
      mods: mods.filter((m) => m.fetched).length,
    });
    return (
      (isFetching || isLoadingInstalled) &&
      mods.filter((m) => m.fetched).length === 0
    );
  }, [isFetching, isLoadingInstalled, mods]);

  /**
   * Sort mods based on query
   */
  const sortedMods = useMemo(() => {
    return [...mods].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          // Compare two ISO dates
          return (
            new Date(b.fetched?.mod_updated ?? 0).getTime() -
            new Date(a.fetched?.mod_updated ?? 0).getTime()
          );
        case 'rating':
          return (b.fetched?.rating ?? 0) - (a.fetched?.rating ?? 0);
        case 'downloads':
          return (
            (b.fetched?.downloads_count ?? 0) -
            (a.fetched?.downloads_count ?? 0)
          );
        default:
          return 0;
      }
    });
  }, [mods, sort]);

  /**
   * Filter mods based on query
   */
  const filteredMods = useMemo(() => {
    const lockedModIds = new Set(useAppStore.getState().lockedModIds);
    const queryStates = new Set(query.state ?? []);

    return sortedMods.filter((mod) => {
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
        shouldInclude = shouldInclude && mod.local != null;
      }

      if (queryStates.has('needsUpdate')) {
        shouldInclude =
          shouldInclude &&
          mod.local?.modinfo_id != null &&
          mod.fetched != null &&
          !isSameVersion(
            mod.fetched?.expand?.mod_versions_via_mod_id[0],
            mod.local
          ) &&
          !lockedModIds.has(mod.local.modinfo_id);
      }
      if (queryStates.has('locked')) {
        shouldInclude =
          shouldInclude &&
          mod.local?.modinfo_id != null &&
          lockedModIds.has(mod.local.modinfo_id);
      }
      if (queryStates.has('uninstalled')) {
        shouldInclude = shouldInclude && !mod.local;
      }
      if (queryStates.has('localOnly')) {
        shouldInclude = shouldInclude && mod.isLocalOnly;
      }
      if (queryStates.has('affectSaves')) {
        shouldInclude =
          shouldInclude &&
          mod.fetched?.expand?.mod_versions_via_mod_id[0]?.affect_saves ===
            true;
      }
      if (queryStates.has('notAffectSaves')) {
        shouldInclude =
          shouldInclude &&
          mod.fetched?.expand?.mod_versions_via_mod_id[0]?.affect_saves ===
            false;
      }

      return shouldInclude;
    });
  }, [sortedMods, query]);

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

  const { t } = useLingui();

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
              label={t`Refresh installed mods list and check for updates`}
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
                    label: t({
                      message: `Installed Mods`,
                      context: 'Header mods filter selection',
                    }),
                    value: 'installed',
                  },
                  {
                    label: t({
                      message: `Available Mods`,
                      context: 'Header mods filter selection',
                    }),
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
            <Trans context="Filtering section title">Filter Mods</Trans>
          </Text>

          <Stack>
            <TextInput
              placeholder={t({
                message: 'Search name, author...',
                context: 'placeholder',
              })}
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
              placeholder={t({
                message: 'Filter by category.',
                context: 'placeholder',
              })}
              size="sm"
              // searchable
              data={categories}
              value={query.category || null}
              clearable
              onChange={(value) => setQuery({ category: value ?? '' })}
            />
            <MultiSelect
              size="sm"
              placeholder={t({
                message: 'Filter by state.',
                context: 'placeholder',
              })}
              value={query.state || null}
              clearable
              onChange={(value) => setQuery({ state: (value as any) ?? '' })}
              data={[
                {
                  label: t({
                    message: `Needs Update`,
                    context: 'Filter by state option',
                  }),
                  value: 'needsUpdate',
                },
                {
                  label: t({
                    message: `Locked`,
                    context: 'Filter by state option',
                  }),
                  value: 'locked',
                },
                {
                  label: t({
                    message: `Not Installed`,
                    context: 'Filter by state option',
                  }),
                  value: 'uninstalled',
                },
                {
                  label: t({
                    message: `Local Only`,
                    context: 'Filter by state option',
                  }),
                  value: 'localOnly',
                },
                {
                  label: t({
                    message: `Affect Saves`,
                    context: 'Filter by state option',
                  }),
                  value: 'affectSaves',
                },
                {
                  label: t({
                    message: `Not Affect Saves`,
                    context: 'Filter by state option',
                  }),
                  value: 'notAffectSaves',
                },
              ]}
            />
            {hasFilters && (
              <Button
                variant="light"
                leftSection={<IconFilterOff size={16} />}
                onClick={resetQuery}
              >
                <Trans context="Button text to reset filter">
                  Reset Filters
                </Trans>
              </Button>
            )}
            <Select
              size="sm"
              leftSection={<IconSortDescending size={16} />}
              placeholder={t`Sort by...`}
              value={sort}
              onChange={(value) => setSort(value as any)}
              data={[
                {
                  label: t({
                    message: 'Sort by Name',
                    context: 'Order by option',
                  }),
                  value: 'name',
                },
                {
                  label: t({
                    message: 'Sort by Last Update',
                    context: 'Order by option',
                  }),
                  value: 'updated',
                },
                {
                  label: t({
                    message: 'Sort by Rating',
                    context: 'Order by option',
                  }),
                  value: 'rating',
                },
                {
                  label: t({
                    message: 'Sort by Downloads',
                    context: 'Order by option',
                  }),
                  value: 'downloads',
                },
              ]}
            />
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
                    <Text fz="sm">
                      <Trans context="Mods update tooltip prefix">
                        Will update:
                      </Trans>
                    </Text>
                    {availableUpdates.map((update) => (
                      <Text fz="sm" key={update.fetched.id}>
                        {update.fetched.name}:{' '}
                        {update.mod.installedVersion?.name} →{' '}
                        {update.targetVersion?.name}
                        {!update.mod.areDependenciesSatisfied && (
                          <Trans context="Suffix for update tooltip, if some dependencies are missing">
                            {' '}
                            (will install missing dependencies)
                          </Trans>
                        )}
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
                  <Plural
                    value={availableUpdates.length}
                    one="Update 1 mod"
                    other="Update # mods"
                  />
                </Button>
              </Tooltip>
            ) : (
              <Button disabled leftSection={<IconChecks size={16} />}>
                <Trans>All mods are updated</Trans>
              </Button>
            )}
          </Stack>

          <Box p="sm" bg="dark.8" style={{ borderRadius: '8px' }}>
            {/* <BackgroundImage src="https://www.civfanatics.com/wp-content/uploads/2016/10/logo.png"> */}
            <Text fz="sm" c="dimmed">
              <Trans>
                All mods are the property of their respective creators.
                <br />
                Special thanks to{' '}
                <a href="https://www.civfanatics.com/" target="_blank">
                  CivFanatics
                </a>{' '}
                for hosting and supporting the modding community.
              </Trans>
            </Text>
            {/* </BackgroundImage> */}
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main className="main">
        <LoadingOverlay visible={isFirstLoading} />
        {!isFirstLoading && (
          <>
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
            {filteredMods.length === 0 && (
              <Box p="lg">
                <Stack gap={'xs'} align="center">
                  <IconEyeQuestion size={40} />
                  <Text>
                    <Trans>No mods found</Trans>
                  </Text>
                  <Text c="dimmed">
                    <Trans context="Help text when no mods are found">
                      Try changing your filters or open Settings and double
                      check Mods folder
                    </Trans>
                  </Text>
                </Stack>
              </Box>
            )}
          </>
        )}
      </AppShell.Main>
    </AppShell>
  );
}
