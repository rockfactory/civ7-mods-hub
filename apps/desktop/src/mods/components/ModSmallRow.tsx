import * as React from 'react';
import { useModsContext } from '../ModsContext';
import { useMemo } from 'react';
import { Group, Text } from '@mantine/core';
import { ModIcon } from './ModIcon';
import { ModData } from '../../home/IModInfo';

export interface IModSmallRowProps {
  mod: ModData | undefined;
  onClick?: React.MouseEventHandler<HTMLDivElement> | undefined;
}

export function ModSmallRow(props: IModSmallRowProps) {
  const { mod } = props;
  if (!mod) {
    return null;
  }

  return (
    <Group gap={'sm'} onClick={props.onClick}>
      <ModIcon mod={mod} width={24} />
      <Text size="sm" fw={500}>
        {mod?.name ?? 'Unknown Mod'}
      </Text>
    </Group>
  );
}
