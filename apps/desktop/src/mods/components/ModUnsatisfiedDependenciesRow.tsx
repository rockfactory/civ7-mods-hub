import * as React from 'react';
import { ModData } from '../../home/IModInfo';
import { useModsContext } from '../ModsContext';
import { Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { useMemo } from 'react';
import { getNotInstalledDependsOn } from '../dependencies/getInstalledDependsOn';
import { ModSmallRow } from './ModSmallRow';
import { notifications } from '@mantine/notifications';
import { IconSettingsExclamation } from '@tabler/icons-react';

export interface IModUnsatisfiedDependenciesRowProps {
  mod: ModData;
  setLoading: (loading: boolean) => void;
}

export function ModUnsatisfiedDependenciesRow(
  props: IModUnsatisfiedDependenciesRowProps
) {
  const { mod, setLoading } = props;
  const { mods, install } = useModsContext();

  const shouldShow = mod.locals.length > 0 && !mod.areDependenciesSatisfied;

  const notInstalledDependsOn = useMemo(() => {
    return getNotInstalledDependsOn(mod, mods);
  }, [mod, mods]);

  if (!shouldShow) {
    return null;
  }

  return (
    <Group>
      <Tooltip
        color="dark.8"
        multiline
        maw={300}
        label={
          <Stack gap={2}>
            <Text size="sm" mb={'xs'}>
              This mod has unsatisfied dependencies. Click to install them.
            </Text>
            {notInstalledDependsOn.map((dep) => (
              <ModSmallRow key={dep.id} mod={dep} />
            ))}
          </Stack>
        }
      >
        <Button
          onClick={async () => {
            try {
              setLoading(true);

              // We don't care about `installedVersion` here, we just want to install
              // the dependencies.
              await install(mod, mod.installedVersion!, {
                onlyDependencies: true,
              });
            } finally {
              // Error handling is done in the `install` function
              setLoading(false);
            }
          }}
          size="xs"
          color="red"
          mt="sm"
          variant="light"
          leftSection={<IconSettingsExclamation size={12} />}
        >
          Unsatisfied dependencies
        </Button>
      </Tooltip>
    </Group>
  );
}
