"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState,
  type Table,
  type VisibilityState,
  type HeaderGroup,
  type Row,
  type Cell,
  type Header,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Loader2 } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Input } from "./input";
import { EmptyState, ErrorState } from "./states";
import { TableSkeleton } from "./skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKeys?: (keyof TData & string)[];
  searchPlaceholder?: string;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  pageSize?: number;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  onEmptyAction?: () => void;
  /** Rendered instead of the table on small screens. */
  mobileCard?: (row: TData) => React.ReactNode;
  pageIndex?: number;
  onPageIndexChange?: (index: number) => void;
  manualPagination?: boolean;
  getRowId?: (row: TData) => string;
  className?: string;
  dense?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKeys,
  searchPlaceholder = "Search…",
  globalFilter: controlledFilter,
  onGlobalFilterChange,
  isLoading,
  error,
  onRetry,
  pageSize = 10,
  toolbar,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters.",
  emptyActionLabel,
  emptyActionHref,
  onEmptyAction,
  mobileCard,
  pageIndex: controlledPageIndex,
  onPageIndexChange,
  manualPagination,
  getRowId,
  className,
  dense,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [internalFilter, setInternalFilter] = React.useState("");
  const [internalPage, setInternalPage] = React.useState(0);

  const globalFilter = controlledFilter ?? internalFilter;
  const setGlobalFilter = React.useCallback(
    (value: string) => {
      if (onGlobalFilterChange) onGlobalFilterChange(value);
      else setInternalFilter(value);
    },
    [onGlobalFilterChange],
  );

  // TanStack Table returns a large object of unstable callbacks, so the React
  // Compiler opts this component out of memoization. Table rows are already keyed.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(manualPagination
        ? { pagination: { pageIndex: controlledPageIndex ?? 0, pageSize } }
        : { pagination: { pageIndex: internalPage, pageSize } }),
    },
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === "function" ? updater(globalFilter) : updater;
      setGlobalFilter(next);
      if (!manualPagination) setInternalPage(0);
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const q = String(filterValue).toLowerCase();
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((key) => String(row.original[key] ?? "").toLowerCase().includes(q));
      }
      return JSON.stringify(row.original).toLowerCase().includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
  });

  React.useEffect(() => {
    setInternalPage(0);
  }, [globalFilter, columnFilters, sorting]);

  const pageCount = manualPagination ? -1 : table.getPageCount();
  const currentPage = manualPagination ? (controlledPageIndex ?? 0) : internalPage;
  const setPage = (index: number) => {
    if (manualPagination) onPageIndexChange?.(index);
    else {
      setInternalPage(index);
      if (onPageIndexChange) onPageIndexChange(index);
    }
  };

  const visibleColumnCount = table.getVisibleLeafColumns().filter((c) => c.id !== "select").length;

  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (isLoading) return <TableSkeleton rows={pageSize} columns={Math.min(6, Math.max(3, visibleColumnCount))} />;

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("space-y-3", className)}>
      {(toolbar || searchKeys) && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {searchKeys && (
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="sm:max-w-xs"
              />
            )}
            {toolbar}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" icon={<Columns3 />}>
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllLeafColumns()
                .filter((c) => c.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    onSelect={(e) => e.preventDefault()}
                    className="capitalize"
                  >
                    {column.id.replace(/([A-Z])/g, " $1")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          actionHref={emptyActionHref}
          onAction={onEmptyAction}
          icon="search"
        />
      ) : mobileCard ? (
        <>
          <div className="hidden md:block">
            <TableContainer table={table} dense={dense} />
          </div>
          <div className="space-y-3 md:hidden">{rows.map((row) => <div key={row.id}>{mobileCard(row.original)}</div>)}</div>
        </>
      ) : (
        <TableContainer table={table} dense={dense} />
      )}

      {rows.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-muted-foreground text-[13px]">
            {manualPagination
              ? `Page ${currentPage + 1}`
              : `Showing ${table.getState().pagination.pageIndex * pageSize + 1}–${
                  Math.min((table.getState().pagination.pageIndex + 1) * pageSize, rows.length)
                } of ${rows.length}`}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            {pageCount > 1 &&
              Array.from({ length: Math.min(pageCount, 5) }).map((_, i) => {
                const start = Math.max(0, Math.min(currentPage - 2, pageCount - 5));
                const p = start + i;
                return (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => setPage(p)}
                    aria-label={`Go to page ${p + 1}`}
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {p + 1}
                  </Button>
                );
              })}
            {pageCount > 5 && currentPage < pageCount - 1 && (
              <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)}>
                Next
              </Button>
            )}
            {pageCount <= 5 && (
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TableContainer<TData>({
  table,
  dense,
}: {
  table: Table<TData>;
  dense?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] caption-bottom text-sm">
            <thead className="bg-muted/60">
              {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header: Header<TData, unknown>) => (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        "text-muted-foreground h-11 px-4 text-left align-middle text-xs font-semibold tracking-wide whitespace-nowrap uppercase",
                        dense ? "py-2.5" : "py-3",
                        header.column.columnDef.meta?.align === "right" && "text-right",
                        header.column.columnDef.meta?.align === "center" && "text-center",
                      )}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded transition focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row: Row<TData>) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/40 border-b border-border transition-colors last:border-0"
                >
                  {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-4 align-middle",
                        dense ? "py-2.5" : "py-3.5",
                        cell.column.columnDef.meta?.align === "right" && "text-right",
                        cell.column.columnDef.meta?.align === "center" && "text-center",
                        cell.column.columnDef.meta?.className,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function useTableFilterState(onChange: (value: string) => void, value: string) {
  const [internal, setInternal] = React.useState(value);
  const [lastValue, setLastValue] = React.useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setInternal(value);
  }

  const handle = React.useCallback(
    (next: string) => {
      setInternal(next);
      onChange(next);
    },
    [onChange],
  );
  return [internal, handle] as const;
}

export function TableLoadingOverlay() {
  return (
    <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
      <Loader2 className="text-primary size-6 animate-spin" />
    </div>
  );
}

export type { ColumnDef, OnChangeFn };
