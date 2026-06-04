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

export function parsePaginationQuery(page?: string, pageSize?: string) {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
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
