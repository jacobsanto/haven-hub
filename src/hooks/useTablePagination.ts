import { useState, useMemo, useCallback } from 'react';

interface UseTablePaginationOptions {
  defaultPageSize?: number;
}

export function useTablePagination<T>(
  data: T[] | undefined,
  options: UseTablePaginationOptions = {}
) {
  const { defaultPageSize = 15 } = options;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalItems = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 when data changes significantly
  const safeCurrentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    if (!data) return [];
    const start = (safeCurrentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safeCurrentPage, pageSize]);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(safeCurrentPage + 1), [goToPage, safeCurrentPage]);
  const prevPage = useCallback(() => goToPage(safeCurrentPage - 1), [goToPage, safeCurrentPage]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    page: safeCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    hasNextPage: safeCurrentPage < totalPages,
    hasPrevPage: safeCurrentPage > 1,
  };
}
