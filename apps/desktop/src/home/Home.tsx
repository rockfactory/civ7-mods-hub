//
import {
  AppShell,
  Text,
  Button,
  Checkbox,
  ScrollArea,
  Card,
  Group,
  Badge,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import PocketBase from 'pocketbase';
import { invoke } from '@tauri-apps/api/core';
import { getAllModsInfo } from '../mods/getAllModsInfo';
import {
  ModsResponse,
  ModVersionsRecord,
  TypedPocketBase,
} from '../pocketbase-types';

/// <reference path="../../../../backend/pb_data/types.d.ts" />
const pb = new PocketBase('http://localhost:8090') as TypedPocketBase;

type FetchedMod = ModsResponse<{
  mod_versions_via_mod_id: ModVersionsRecord[];
}>;

export default function ModsListPage() {
  const [mods, setMods] = useState<FetchedMod[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);

  useEffect(() => {
    async function findMods() {
      const folder = await invoke('get_mods_folder', {});
      console.log('Mods folder:', folder);

      const modsInfo = await getAllModsInfo();
      console.log('Mods info:', modsInfo);
    }

    findMods().catch(console.error);
  }, []);

  useEffect(() => {
    async function fetchMods() {
      const records = await pb.collection('mods').getFullList<FetchedMod>({
        expand: 'mod_versions_via_mod_id',
      });

      console.log('Mods data:', records);
      setMods(records);
    }

    fetchMods();
  }, []);

  const applyFilters = () => {
    // Placeholder: implement actual filtering logic
    console.log('Applying filters:', selectedRatings);
  };

  return (
    <AppShell
      padding="md"
      navbar={{ width: 300, breakpoint: 'sm' }}
      header={{ height: 60 }}
    >
      <AppShell.Header p="xs">
        <Text fw={700} size="xl">
          Civ7 Mod Manager
        </Text>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text fw={600} size="lg" mb="sm">
          Filter Mods
        </Text>

        <Checkbox.Group
          value={selectedRatings}
          onChange={setSelectedRatings}
          label="Ratings"
        >
          <Checkbox value="5" label="5 stars" />
          <Checkbox value="4" label="4 stars" />
          <Checkbox value="3" label="3 stars" />
          <Checkbox value="No rating" label="No rating" />
        </Checkbox.Group>

        <Button mt="md" onClick={applyFilters}>
          Apply Filters
        </Button>
      </AppShell.Navbar>

      <AppShell.Main>
        <ScrollArea>
          {mods.map((mod) => (
            <Card key={mod.id} shadow="sm" p="lg" mb="md">
              <Group justify="space-between">
                <Text fw={600}>{mod.name}</Text>
                <Badge>{mod.rating} ★</Badge>
              </Group>

              <Text size="sm" c="dimmed">
                by {mod.author}
              </Text>
              <Text mt="xs">{mod.short_description}</Text>

              {mod.expand?.mod_versions_via_mod_id &&
                mod.expand.mod_versions_via_mod_id.length > 0 && (
                  <Badge mt="sm" variant="outline">
                    Latest:{' '}
                    {mod.expand?.mod_versions_via_mod_id[0].name ?? 'N/A'}
                  </Badge>
                )}

              <Button mt="md" variant="light">
                Install
              </Button>
            </Card>
          ))}
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}
