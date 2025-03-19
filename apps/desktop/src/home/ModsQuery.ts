import { useCallback, useState, useTransition } from 'react';

export interface ModsQuery {
  text: string;
  category: string;
  onlyInstalled: boolean;
  state: '' | 'needsUpdate' | 'locked' | 'uninstalled';
}

const defaultQuery: ModsQuery = {
  text: '',
  category: '',
  onlyInstalled: true,
  state: '',
};

export type SetModsQueryFn = (query: Partial<ModsQuery>) => void;

export function useModsQuery() {
  const [query, setQuery] = useState<ModsQuery>({
    ...defaultQuery,
  });

  const hasFilters = query.text || query.category;

  const [isPending, startTransition] = useTransition();

  const setQueryWithTransition = useCallback(
    (newQuery: Partial<ModsQuery>) => {
      startTransition(() => {
        setQuery((q) => ({
          ...q,
          ...(newQuery.state === 'uninstalled' ? { onlyInstalled: false } : {}),
          ...newQuery,
        }));
      });
    },
    [setQuery, startTransition]
  );

  const resetQuery = useCallback(() => {
    setQueryWithTransition({
      ...defaultQuery,
      onlyInstalled: query.onlyInstalled,
    });
  }, [query, setQueryWithTransition]);

  return {
    query,
    isQueryPending: isPending,
    setQuery: setQueryWithTransition,
    resetQuery,
    hasFilters,
  };
}
