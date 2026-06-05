import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DataTable = ({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = 'Search...',
  searchValue,          // optional controlled value from parent
  onSearchChange,       // optional controlled handler from parent
  pageSize = 10,
  emptyMessage = 'No data found.',
}) => {
  // Use controlled or internal search state
  const [internalSearch, setInternalSearch] = useState('');
  const [page, setPage] = useState(1);

  const search = searchValue !== undefined ? searchValue : internalSearch;

  const handleSearchChange = (val) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
    setPage(1);
  };

  // Reset page when data changes
  useEffect(() => {
    setPage(1);
  }, [data.length]);

  // Reset page when search changes from outside
  useEffect(() => {
    if (searchValue !== undefined) setPage(1);
  }, [searchValue]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        if (!col.accessor || typeof col.accessor !== 'function') return false;
        const val = col.searchValue
          ? col.searchValue(row)
          : col.header;
        // Try to get raw string value for searching
        const rawVal = row[col.key] ?? '';
        return String(rawVal).toLowerCase().includes(q);
      }) ||
      // Fallback: search all string values in the row
      Object.values(row).some(
        (v) => typeof v === 'string' && v.toLowerCase().includes(q)
      )
    );
  }, [data, search, columns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-input flex-1 max-w-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <Search size={15} className="text-text-secondary shrink-0" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-text-primary placeholder:text-text-secondary"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-text-secondary ml-auto">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left font-semibold text-text-secondary text-xs uppercase tracking-wide"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-text-secondary text-sm">
                  {search ? `No results for "${search}"` : emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, rowIdx) => (
                <tr key={row._id || rowIdx} className="hover:bg-background/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-background">
          <p className="text-xs text-text-secondary">
            Page {page} of {totalPages} · {filtered.length} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;