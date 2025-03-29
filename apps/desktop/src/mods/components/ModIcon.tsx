import * as React from 'react';
import { ModData } from '../../home/IModInfo';
import { Box, Image } from '@mantine/core';
import styles from './ModIcon.module.css';
import { IconSettings } from '@tabler/icons-react';

export interface IModIconProps {
  mod?: ModData;
  width?: number;
}

export function ModIcon(props: IModIconProps) {
  const { mod, width = 40 } = props;
  const fetched = mod?.fetched;

  return fetched?.icon_url ? (
    <Image
      width={width}
      height={width}
      style={{ borderRadius: '4px' }}
      src={fetched.icon_url}
      alt={fetched.name}
    />
  ) : (
    <Box
      w={width}
      h={width}
      className={
        styles.modIcon + ' ' + (mod?.isLocalOnly ? styles.localOnly : '')
      }
    >
      <IconSettings size={width} />
    </Box>
  );
}
