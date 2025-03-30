import { useCallback, useState, useTransition } from 'react';

export interface ModsQuery {
  text: string;
  category: string;
  onlyInstalled: boolean;
  state: Array<
    | 'needsUpdate'
    | 'locked'
    | 'uninstalled'
    | 'localOnly'
    | 'affectSaves'
    | 'notAffectSaves'
  >;
}

const defaultQuery: ModsQuery = {
  text: '',
  category: '',
  onlyInstalled: true,
  state: [],
};

export type ModsSortBy = 'name' | 'updated' | 'rating' | 'downloads';

export type SetModsQueryFn = (query: Partial<ModsQuery>) => void;

export function useModsQuery() {
  // Sorting
  const [sort, setSort] = useState<ModsSortBy>('updated');

  // Filters
  const [query, setQuery] = useState<ModsQuery>({
    ...defaultQuery,
  });

  const hasFilters = query.text || query.category || query.state.length > 0;

  const [isPending, startTransition] = useTransition();

  const setQueryWithTransition = useCallback(
    (newQuery: Partial<ModsQuery>) => {
      startTransition(() => {
        setQuery((q) => ({
          ...q,
          ...(newQuery.state?.includes('uninstalled')
            ? { onlyInstalled: false }
            : {}),
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
    sort,
    setSort,
  };
}
