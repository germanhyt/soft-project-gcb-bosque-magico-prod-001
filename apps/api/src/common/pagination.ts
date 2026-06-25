export type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginatedMeta;
};

const PAGE_SIZE_OPTIONS = [20, 40, 60, 100, 200] as const;
const DEFAULT_PAGE_SIZE = 20;

function parsePageSize(raw?: string): number {
  const n = Number(raw);
  if (PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])) {
    return n;
  }
  return DEFAULT_PAGE_SIZE;
}

export function parsePaginationQuery(page?: string, pageSize?: string) {
  const p = Math.max(1, Number(page) || 1);
  const size = parsePageSize(pageSize);
  return {
    page: p,
    pageSize: size,
    skip: (p - 1) * size,
  };
}

export function buildPaginatedMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginatedMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
