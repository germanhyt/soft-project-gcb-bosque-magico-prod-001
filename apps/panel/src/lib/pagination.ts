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

export type ListQueryParams = {
  page?: number;
  pageSize?: number;
};
