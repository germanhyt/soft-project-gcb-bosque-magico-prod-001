import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE, parsePageSize, type PageSize } from '../lib/pagination';

export function useListPagination() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = parsePageSize(searchParams.get('pageSize'));

  const setPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(searchParams);
      if (p <= 1) next.delete('page');
      else next.set('page', String(p));
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const setPageSize = useCallback(
    (size: PageSize) => {
      const next = new URLSearchParams(searchParams);
      if (size === DEFAULT_PAGE_SIZE) next.delete('pageSize');
      else next.set('pageSize', String(size));
      next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  return { page, pageSize, setPage, setPageSize };
}
