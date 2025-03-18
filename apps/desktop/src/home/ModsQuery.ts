import { useCallback, useState, useTransition } from 'react';

export interface ModsQuery {
  text: string;
  category: string;
  onlyInstalled: boolean;
}

const defaultQuery: ModsQuery = {
  text: '',
  category: '',
  onlyInstalled: true,
};

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
          ...newQuery,
        }));
      });
    },
    [setQuery, startTransition]
  );

  const resetQuery = useCallback(() => {
    setQueryWithTransition({
      ...defaultQuery,
    });
  }, [setQueryWithTransition]);

  return {
    query,
    isQueryPending: isPending,
    setQuery: setQueryWithTransition,
    resetQuery,
    hasFilters,
  };
}
