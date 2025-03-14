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
  BackgroundImage,
  LoadingOverlay,
  SegmentedControl,
} from '@mantine/core';
import { useState, useEffect, useMemo, useCallback } from 'react';
import PocketBase from 'pocketbase';
import { invoke } from '@tauri-apps/api/core';
import {
  IconChecks,
  IconDownload,
  IconEyeQuestion,
  IconFolder,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import { ModBox } from '../mods/ModBox';
import { useApplyUpdates } from '../mods/checkUpdates';
import { useModsContext } from '../mods/ModsContext';
import { SettingsDrawer } from '../settings/SettingsDrawer';

export default function ModsListPage() {
  const {
    mods,
    triggerReload,
    chooseModFolder,
    isFetching,
    isLoadingInstalled,
  } = useModsContext();
  const [query, setQuery] = useState({ text: '', onlyInstalled: true });

  const isFirstLoading =
    (isFetching || isLoadingInstalled) && mods.length === 0;

  const filteredMods = useMemo(() => {
    const installedModIds = new Set(
      mods
        .filter(({ local }) => local?.modinfo_id)
        .map(({ local }) => local?.modinfo_id)
    );

    return mods.filter((mod) => {
      let shouldInclude = true;

      if (query.text) {
        const searchText =
          mod.fetched.name.toLocaleLowerCase() +
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

      if (query.onlyInstalled) {
        shouldInclude =
          shouldInclude &&
          installedModIds.has(
            mod.fetched.expand?.mod_versions_via_mod_id[0].modinfo_id
          );
      }

      return shouldInclude;
    });
  }, [mods, query]);

  const { availableUpdates, isUpdating, applyUpdates } = useApplyUpdates();

  return (
    <AppShell
      padding="sm"
      navbar={{ width: 300, breakpoint: 'sm' }}
      header={{ height: 60 }}
    >
      <AppShell.Header p="xs">
        <Group justify="flex-start" align="center" gap={0}>
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
          </Group>
          <Group
            justify="space-between"
            align="center"
            gap="sm"
            flex="1 1 auto"
          >
            <Group gap="sm">
              <SegmentedControl
                value={query.onlyInstalled ? 'installed' : 'available'}
                onChange={(value) =>
                  setQuery((q) => ({
                    ...q,
                    onlyInstalled: value === 'installed',
                  }))
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
              placeholder="Search..."
              value={query.text}
              onChange={(event) =>
                setQuery((q) => ({ ...q, text: event.currentTarget.value }))
              }
              rightSection={<IconSearch size={16} />}
            />
          </Stack>

          {/* <Button mt="md" onClick={applyFilters}>
          Apply Filters
        </Button> */}

          <Stack mt="md">
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
                      <Text fz="sm" key={update.mod.fetched.id}>
                        {update.mod.fetched.name}:{' '}
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
        </AppShell.Section>
        <AppShell.Section>
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

      <AppShell.Main>
        <LoadingOverlay visible={isFirstLoading} />
        <ScrollArea scrollbars="y">
          {filteredMods.map((mod) => (
            <ModBox key={mod.fetched.id} mod={mod} />
          ))}
          {filteredMods.length === 0 && (
            <Box p="lg">
              <Stack gap={'xs'} align="center">
                <IconEyeQuestion size={40} />
                <Text>No mods found</Text>
                <Text c="dimmed">
                  Try changing your filters or open Settings and double check
                  Mods folder
                </Text>
              </Stack>
            </Box>
          )}
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}
