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
} from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import PocketBase from 'pocketbase';
import { invoke } from '@tauri-apps/api/core';
import { IconEyeQuestion, IconRefresh, IconSearch } from '@tabler/icons-react';
import { TypedPocketBase } from '../pocketbase-types';
import { FetchedMod, ModBox } from '../mods/ModBox';
import { ModInfo } from './IModInfo';

const pb = new PocketBase(
  'https://backend.civmods.com'
  /*'http://localhost:8090'*/
) as TypedPocketBase;

export default function ModsListPage() {
  const [mods, setMods] = useState<FetchedMod[]>([]);

  const [modsInfo, setModsInfo] = useState<ModInfo[]>([]);

  const [localModsReloadIndex, setLocalModsReloadIndex] = useState(0);

  const [query, setQuery] = useState({ text: '', onlyInstalled: false });

  useEffect(() => {
    async function findMods() {
      const folder = await invoke('get_mods_folder', {});
      console.log('Mods folder:', folder);

      const modsInfo = await invoke<ModInfo[]>('scan_civ_mods', {
        modsFolderPath: folder,
      });

      setModsInfo(modsInfo);
      console.log('Mods info:', modsInfo);
    }

    findMods().catch(console.error);
  }, [localModsReloadIndex]);

  useEffect(() => {
    async function fetchMods() {
      const records = await pb.collection('mods').getFullList<FetchedMod>({
        expand: 'mod_versions_via_mod_id',
      });

      console.log('Mods data:', records);
      setMods(records);
    }

    fetchMods();
  }, [localModsReloadIndex]);

  const filteredMods = useMemo(() => {
    const installedModIds = new Set(modsInfo.map((info) => info.modinfo_id));

    return mods.filter((mod) => {
      let shouldInclude = true;

      if (query.text) {
        const searchText =
          mod.name.toLocaleLowerCase() + ' ' + mod.id + ' ' + mod.author;
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
            mod.expand?.mod_versions_via_mod_id[0].modinfo_id
          );
      }

      return shouldInclude;
    });
  }, [mods, query]);

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
          <ActionIcon
            variant="subtle"
            onClick={() => setLocalModsReloadIndex((i) => i + 1)}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
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
      </AppShell.Navbar>

      <AppShell.Main>
        <ScrollArea>
          {filteredMods.map((mod) => (
            <ModBox
              key={mod.id}
              mod={mod}
              modsInfo={modsInfo}
              onActionComplete={() => setLocalModsReloadIndex((i) => i + 1)}
            />
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
