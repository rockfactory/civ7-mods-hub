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
} from '@mantine/core';
import { useState, useEffect, useMemo, useCallback } from 'react';
import PocketBase from 'pocketbase';
import { invoke } from '@tauri-apps/api/core';
import {
  IconChecks,
  IconDownload,
  IconEyeQuestion,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import { ModBox } from '../mods/ModBox';
import { useApplyUpdates } from '../mods/checkUpdates';
import { useModsContext } from '../mods/ModsContext';

export default function ModsListPage() {
  const { mods, triggerReload } = useModsContext();
  const [query, setQuery] = useState({ text: '', onlyInstalled: false });

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
        <Group gap="sm">
          <Text fw={700} size="xl">
            Civ7 Mod Manager
          </Text>
          <ActionIcon variant="subtle" onClick={() => triggerReload()}>
            <IconRefresh size={16} />
          </ActionIcon>
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
                setQuery((q) => ({ ...query, text: event.currentTarget.value }))
              }
              rightSection={<IconSearch size={16} />}
            />
            <Checkbox
              label="Only Installed"
              checked={query.onlyInstalled}
              onChange={(event) =>
                setQuery((q) => ({
                  ...query,
                  onlyInstalled: event.currentTarget.checked,
                }))
              }
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
                  <Stack gap="sm">
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
        <ScrollArea scrollbars="y">
          {filteredMods.map((mod) => (
            <ModBox key={mod.fetched.id} mod={mod} />
          ))}
          {filteredMods.length === 0 && (
            <Box p="lg">
              <Stack gap={'xs'} align="center">
                <IconEyeQuestion size={40} />
                <Text>No mods found</Text>
                <Text c="dimmed">Try changing your filters</Text>
              </Stack>
            </Box>
          )}
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}
