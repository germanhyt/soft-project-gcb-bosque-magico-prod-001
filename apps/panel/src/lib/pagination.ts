export type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginatedMeta;
};

export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [20, 40, 60, 100, 200] as const;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function parsePageSize(raw?: string | number | null): PageSize {
  const n = Number(raw);
  if (PAGE_SIZE_OPTIONS.includes(n as PageSize)) return n as PageSize;
  return DEFAULT_PAGE_SIZE;
}

export type ListQueryParams = {
  page?: number;
  pageSize?: number;
};
