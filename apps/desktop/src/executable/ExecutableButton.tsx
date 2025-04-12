import { Button } from '@mantine/core';
import * as React from 'react';
import { useExecutableState } from './useExecutableState';
import { useEffect, useMemo, useState } from 'react';
import { useExecutableInstallation } from './useExecutableInstallation';
import { invokeLaunchCiv7 } from './executableRustBinding';
import { IconPlayerPlayFilled } from '@tabler/icons-react';

export interface IExecutableButtonProps {}

export function ExecutableButton(props: IExecutableButtonProps) {
  const { isRunning, isLoading } = useExecutableState();

  const { installation } = useExecutableInstallation();

  const [isStarting, setIsStarting] = useState(false);

  return (
    <Button
      size="lg"
      color={!isRunning ? 'green' : 'blue'}
      leftSection={<IconPlayerPlayFilled size={24} />}
      loading={isStarting}
      disabled={isRunning || isStarting}
      onClick={async () => {
        if (isLoading) {
          console.log('Loading installation, please wait...');
          return;
        }

        if (!installation) {
          console.error('No installation found');
          return;
        }

        if (isRunning) {
          console.log('Civ7 is already running');
          return;
        }

        console.log('Launching Civ7...');
        try {
          setIsStarting(true);
          await invokeLaunchCiv7(installation);
          console.log('Civ7 launched successfully');
        } catch (error) {
          console.error('Error launching Civ7:', error);
        } finally {
          setIsStarting(false);
        }
      }}
    >
      {isRunning ? 'Civ7 is running' : 'Launch Civ7'}
    </Button>
  );
}
