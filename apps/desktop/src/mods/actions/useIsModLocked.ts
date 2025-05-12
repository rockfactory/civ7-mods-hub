import { useMemo } from 'react';
import { useAppStore } from '../../store/store';

export function useIsModLocked(modinfoIds: string[]) {
  const lockedModIds = useAppStore((state) => state.lockedModIds);
  return useMemo(() => {
    const lockedModIdsSet = new Set(lockedModIds);
    return modinfoIds.some((id) => lockedModIdsSet.has(id));
  }, [lockedModIds, modinfoIds]);
}
