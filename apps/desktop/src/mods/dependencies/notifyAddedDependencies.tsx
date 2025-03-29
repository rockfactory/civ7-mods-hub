import { notifications } from '@mantine/notifications';
import { DependencyInfo } from './DependencyInfo';
import { ModIcon } from '../components/ModIcon';
import { Group } from '@mantine/core';

export function notifyAddedDependencies(dependencies: DependencyInfo[]) {
  for (let i = 0; i < dependencies.length; i++) {
    const dep = dependencies[i];
    notifications.show({
      color: 'blue',
      title: 'Dependency installed',
      message: (
        <Group>
          <ModIcon mod={dep.modData} width={24} />
          {dep.modData!.name} {dep.targetVersion!.name} installed successfully
        </Group>
      ),
    });
    if (i > 3) {
      notifications.show({
        color: 'blue',
        title: 'More dependencies installed',
        message: `${dependencies.length - i} more dependencies installed`,
      });
      break;
    }
  }
}
