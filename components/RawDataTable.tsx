"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import { RawDataRow } from "@/types";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";

interface RawDataTableProps {
  data: RawDataRow[];
}

interface EnrichedRawDataRow extends RawDataRow {
  cpc: number;
  cpal: number;
  roi: number;
  ctr: number;
  cvr: number;
  sctr: number;
  cotal: number;
}

export default function RawDataTable({ data }: RawDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Enrich data with calculated metrics
  const enrichedData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      cpc: row.clicks > 0 ? row.cost / row.clicks : 0,
      cpal: row.approved_leads > 0 ? row.cost / row.approved_leads : 0,
      roi: row.cost > 0 ? (row.revenue / row.cost) * 100 : 0,
      ctr: row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0,
      cvr: row.clicks > 0 ? (row.approved_leads / row.clicks) * 100 : 0,
      sctr: row.clicks > 0 ? (row.click_out / row.clicks) * 100 : 0,
      cotal: row.click_out > 0 ? (row.approved_leads / row.click_out) * 100 : 0,
    }));
  }, [data]);

  const columns = useMemo<ColumnDef<EnrichedRawDataRow>[]>(
    () => [
      {
        accessorKey: "stats_date_tz",
        header: "Date",
        cell: (info) => (
          <div className="font-medium text-gray-900 whitespace-nowrap">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "account_name",
        header: "Account",
        cell: (info) => (
          <div className="text-gray-900 max-w-xs truncate" title={info.getValue() as string}>
            {info.getValue() as string || "-"}
          </div>
        ),
      },
      {
        accessorKey: "campaign_name",
        header: "Campaign",
        cell: (info) => (
          <div className="text-gray-900 max-w-xs truncate" title={info.getValue() as string}>
            {info.getValue() as string || "-"}
          </div>
        ),
      },
      {
        accessorKey: "publisher_name",
        header: "Publisher",
        cell: (info) => (
          <div className="text-gray-900">{info.getValue() as string || "-"}</div>
        ),
      },
      {
        accessorKey: "device",
        header: "Device",
        cell: (info) => (
          <div className="text-gray-900">{info.getValue() as string || "-"}</div>
        ),
      },
      {
        accessorKey: "campaign_quality",
        header: "Quality",
        cell: (info) => (
          <div className="text-gray-900">{info.getValue() as string || "-"}</div>
        ),
      },
      {
        accessorKey: "page",
        header: "Page",
        cell: (info) => (
          <div className="text-gray-900">{info.getValue() as string || "-"}</div>
        ),
      },
      {
        accessorKey: "impressions",
        header: "Impressions",
        cell: (info) => (
          <div className="text-right text-gray-700">
            {(info.getValue() as number).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "clicks",
        header: "Clicks",
        cell: (info) => (
          <div className="text-right text-gray-700">
            {(info.getValue() as number).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: (info) => (
          <div className="text-right font-medium text-gray-900">
            ${(info.getValue() as number).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        ),
      },
      {
        accessorKey: "revenue",
        header: "Revenue",
        cell: (info) => (
          <div className="text-right font-medium text-gray-900">
            ${(info.getValue() as number).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        ),
      },
      {
        accessorKey: "approved_leads",
        header: "Approved Leads",
        cell: (info) => (
          <div className="text-right text-gray-700">
            {(info.getValue() as number).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "click_out",
        header: "Click Outs",
        cell: (info) => (
          <div className="text-right text-gray-700">
            {(info.getValue() as number).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "cpc",
        header: "CPC",
        cell: (info) => (
          <div className="text-right text-gray-700">
            ${(info.getValue() as number).toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "cpal",
        header: "CPAL",
        cell: (info) => (
          <div className="text-right text-gray-700">
            ${(info.getValue() as number).toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "roi",
        header: "ROI %",
        cell: (info) => {
          const value = info.getValue() as number;
          return (
            <div
              className={`text-right font-medium ${
                value > 100 ? "text-green-600" : "text-red-600"
              }`}
            >
              {value.toFixed(2)}%
            </div>
          );
        },
      },
      {
        accessorKey: "ctr",
        header: "CTR %",
        cell: (info) => (
          <div className="text-right text-gray-700">
            {(info.getValue() as number).toFixed(2)}%
          </div>
        ),
      },
      {
        accessorKey: "cvr",
        header: "CVR %",
        cell: (info) => (
          <div className="text-right text-gray-700">
            {(info.getValue() as number).toFixed(2)}%
          </div>
        ),
      },
      {
        accessorKey: "sctr",
        header: "SCTR %",
        cell: (info) => (
          <div className="text-right text-gray-700">
            {(info.getValue() as number).toFixed(2)}%
          </div>
        ),
      },
      {
        accessorKey: "cotal",
        header: "COTAL %",
        cell: (info) => (
          <div className="text-right text-gray-700">
            {(info.getValue() as number).toFixed(2)}%
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: enrichedData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Raw Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Detailed granular data with all dimensions and metrics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search across all columns..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1 whitespace-nowrap">
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                      <span className="ml-1">
                        {{
                          asc: <ArrowUp className="w-4 h-4 text-blue-600" />,
                          desc: <ArrowDown className="w-4 h-4 text-blue-600" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`hover:bg-blue-50 transition-colors ${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getRowModel().rows.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-gray-400 text-lg">No data available</div>
          {globalFilter && (
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your search filter
            </p>
          )}
        </div>
      )}

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors font-medium text-sm"
            >
              First
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors font-medium text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors font-medium text-sm"
            >
              Next
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors font-medium text-sm"
            >
              Last
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[20, 50, 100, 200].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-700 font-medium">
              {table.getFilteredRowModel().rows.length} total rows
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
