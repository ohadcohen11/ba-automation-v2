"use client";

import { useMemo } from "react";
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
import { useState } from "react";

interface DailyKPIsTableProps {
  data: RawDataRow[];
  targetDate?: string;
}

interface DailyKPI {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  revenue: number;
  approved_leads: number;
  click_out: number;
  cpc: number;
  cpal: number;
  cpoc: number;
  roi: number;
  ctr: number;
  cvr: number;
  sctr: number;
  cotal: number;
}

// Helper to determine if lower is better for a metric
const isLowerBetter = (metric: string) => {
  return ["cpc", "cpal", "cpoc", "cost"].includes(metric);
};

// Calculate statistical significance threshold for proportion-based metrics
const calculateThreshold = (baseline: number, sampleSize: number, confidenceLevel: number = 1.96) => {
  // baseline should be a proportion (0-1 for percentages, or raw value)
  // Standard Error: SE = sqrt(P * (1-P) / n)
  const p = baseline / 100; // Convert percentage to proportion
  const se = Math.sqrt((p * (1 - p)) / sampleSize);
  const margin = confidenceLevel * se * 100; // Convert back to percentage

  return {
    lowerBound: Math.max(0, baseline - margin),
    upperBound: Math.min(100, baseline + margin),
    margin: margin,
  };
};

// Check if value is statistically significant (outside threshold)
const isStatisticallySignificant = (
  current: number,
  baseline: number,
  sampleSize: number,
  metricType: string,
  minimumSampleSize: number = 20
) => {
  // Skip if sample size too small
  if (sampleSize < minimumSampleSize) return { significant: false, reason: "low_volume" };

  // For proportion-based metrics (CVR, CTR, SCTR, COTAL, ROI as percentage)
  if (["cvr", "ctr", "sctr", "cotal", "roi"].includes(metricType)) {
    const threshold = calculateThreshold(baseline, sampleSize);
    const isOutside = current < threshold.lowerBound || current > threshold.upperBound;
    return {
      significant: isOutside,
      threshold,
      reason: isOutside ? "outside_threshold" : "within_threshold",
    };
  }

  // For count/volume metrics with zero check
  if (["approved_leads"].includes(metricType) && current === 0 && sampleSize > 50) {
    return { significant: true, reason: "zero_value", threshold: null };
  }

  return { significant: false, reason: "not_tested", threshold: null };
};

// Helper to calculate change indicator with statistical significance
const ChangeIndicator = ({
  current,
  baseline,
  metric,
  sampleSize
}: {
  current: number;
  baseline: number;
  metric: string;
  sampleSize: number;
}) => {
  if (!baseline) return null;

  const changePercent = ((current - baseline) / baseline) * 100;
  const isIncrease = changePercent > 0;
  const lowerIsBetter = isLowerBetter(metric);
  const isGood = (isIncrease && !lowerIsBetter) || (!isIncrease && lowerIsBetter);

  // Check statistical significance
  const sigTest = isStatisticallySignificant(current, baseline, sampleSize, metric);

  if (Math.abs(changePercent) < 0.5) return null;

  return (
    <div className="flex flex-col ml-2 text-xs">
      <div className={`flex items-center font-medium ${
        sigTest.significant
          ? (isGood ? "text-green-700" : "text-red-700 font-bold")
          : (isGood ? "text-green-500" : "text-orange-500")
      }`}>
        {isIncrease ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        <span className="ml-0.5">{isIncrease ? '+' : '-'}{Math.abs(changePercent).toFixed(1)}%</span>
        {sigTest.significant && <span className="ml-1 text-[10px]">⚠️</span>}
      </div>
      {sigTest.reason === "low_volume" && (
        <div className="text-[10px] text-gray-400 mt-0.5">Low volume</div>
      )}
    </div>
  );
};

export default function DailyKPIsTable({ data, targetDate }: DailyKPIsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Aggregate data by date
  const { dailyKPIs, baselineAverages } = useMemo(() => {
    const aggregated = data.reduce((acc, row) => {
      const date = row.stats_date_tz;
      if (!acc[date]) {
        acc[date] = {
          date,
          impressions: 0,
          clicks: 0,
          cost: 0,
          revenue: 0,
          approved_leads: 0,
          click_out: 0,
        };
      }
      acc[date].impressions += row.impressions;
      acc[date].clicks += row.clicks;
      acc[date].cost += row.cost;
      acc[date].revenue += row.revenue;
      acc[date].approved_leads += row.approved_leads;
      acc[date].click_out += row.click_out;
      return acc;
    }, {} as Record<string, any>);

    // Calculate derived metrics
    const kpis = Object.values(aggregated).map((day: any) => ({
      ...day,
      cpc: day.clicks > 0 ? day.cost / day.clicks : 0,
      cpal: day.approved_leads > 0 ? day.cost / day.approved_leads : 0,
      cpoc: day.click_out > 0 ? day.cost / day.click_out : 0,
      roi: day.cost > 0 ? (day.revenue / day.cost) * 100 : 0,
      ctr: day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0,
      cvr: day.clicks > 0 ? (day.approved_leads / day.clicks) * 100 : 0,
      sctr: day.clicks > 0 ? (day.click_out / day.clicks) * 100 : 0,
      cotal: day.click_out > 0 ? (day.approved_leads / day.click_out) * 100 : 0,
    })) as DailyKPI[];

    // Calculate baseline averages (excluding target date)
    const baselineDays = kpis.filter((kpi) => kpi.date !== targetDate);
    const count = baselineDays.length || 1;

    const baselineAverages = baselineDays.length > 0 ? {
      impressions: baselineDays.reduce((sum, d) => sum + d.impressions, 0) / count,
      clicks: baselineDays.reduce((sum, d) => sum + d.clicks, 0) / count,
      cost: baselineDays.reduce((sum, d) => sum + d.cost, 0) / count,
      revenue: baselineDays.reduce((sum, d) => sum + d.revenue, 0) / count,
      approved_leads: baselineDays.reduce((sum, d) => sum + d.approved_leads, 0) / count,
      click_out: baselineDays.reduce((sum, d) => sum + d.click_out, 0) / count,
      cpc: baselineDays.reduce((sum, d) => sum + d.cpc, 0) / count,
      cpal: baselineDays.reduce((sum, d) => sum + d.cpal, 0) / count,
      cpoc: baselineDays.reduce((sum, d) => sum + d.cpoc, 0) / count,
      roi: baselineDays.reduce((sum, d) => sum + d.roi, 0) / count,
      ctr: baselineDays.reduce((sum, d) => sum + d.ctr, 0) / count,
      cvr: baselineDays.reduce((sum, d) => sum + d.cvr, 0) / count,
      sctr: baselineDays.reduce((sum, d) => sum + d.sctr, 0) / count,
      cotal: baselineDays.reduce((sum, d) => sum + d.cotal, 0) / count,
    } : null;

    return { dailyKPIs: kpis, baselineAverages };
  }, [data, targetDate]);

  const columns = useMemo<ColumnDef<DailyKPI>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => {
          const isTarget = info.getValue() === targetDate;
          return (
            <div className={`font-medium ${isTarget ? "text-blue-600" : "text-gray-900"}`}>
              {info.getValue() as string}
              {isTarget && <div className="text-xs text-blue-500">Target</div>}
            </div>
          );
        },
      },
      {
        accessorKey: "impressions",
        header: "Impressions",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right flex items-center justify-end">
              {(info.getValue() as number).toLocaleString()}
              {isTarget && baselineAverages && <ChangeIndicator current={row.impressions} baseline={baselineAverages.impressions} metric="impressions" sampleSize={row.impressions} />}
            </div>
          );
        },
      },
      {
        accessorKey: "clicks",
        header: "Clicks",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right flex items-center justify-end">
              {(info.getValue() as number).toLocaleString()}
              {isTarget && baselineAverages && <ChangeIndicator current={row.clicks} baseline={baselineAverages.clicks} metric="clicks" sampleSize={row.impressions} />}
            </div>
          );
        },
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right font-medium text-gray-900 flex items-center justify-end">
              ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {isTarget && baselineAverages && <ChangeIndicator current={row.cost} baseline={baselineAverages.cost} metric="cost" sampleSize={row.clicks} />}
            </div>
          );
        },
      },
      {
        accessorKey: "revenue",
        header: "Revenue",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right font-medium text-gray-900 flex items-center justify-end">
              ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {isTarget && baselineAverages && <ChangeIndicator current={row.revenue} baseline={baselineAverages.revenue} metric="revenue" sampleSize={row.clicks} />}
            </div>
          );
        },
      },
      {
        accessorKey: "approved_leads",
        header: "Approved Leads",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right flex items-center justify-end">
              {(info.getValue() as number).toLocaleString()}
              {isTarget && baselineAverages && <ChangeIndicator current={row.approved_leads} baseline={baselineAverages.approved_leads} metric="approved_leads" sampleSize={row.clicks} />}
            </div>
          );
        },
      },
      {
        accessorKey: "click_out",
        header: "Click Outs",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right flex items-center justify-end">
              {(info.getValue() as number).toLocaleString()}
              {isTarget && baselineAverages && <ChangeIndicator current={row.click_out} baseline={baselineAverages.click_out} metric="click_out" sampleSize={row.clicks} />}
            </div>
          );
        },
      },
      {
        accessorKey: "cpc",
        header: "CPC",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right text-gray-700 flex items-center justify-end">
              ${(info.getValue() as number).toFixed(2)}
              {isTarget && baselineAverages && <ChangeIndicator current={row.cpc} baseline={baselineAverages.cpc} metric="cpc" sampleSize={row.clicks} />}
            </div>
          );
        },
      },
      {
        accessorKey: "cpal",
        header: "CPAL",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right text-gray-700 flex items-center justify-end">
              ${(info.getValue() as number).toFixed(2)}
              {isTarget && baselineAverages && <ChangeIndicator current={row.cpal} baseline={baselineAverages.cpal} metric="cpal" sampleSize={row.approved_leads} />}
            </div>
          );
        },
      },
      {
        accessorKey: "cpoc",
        header: "CPOC",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right text-gray-700 flex items-center justify-end">
              ${(info.getValue() as number).toFixed(2)}
              {isTarget && baselineAverages && <ChangeIndicator current={row.cpoc} baseline={baselineAverages.cpoc} metric="cpoc" sampleSize={row.click_out} />}
            </div>
          );
        },
      },
      {
        accessorKey: "roi",
        header: "ROI %",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          const value = info.getValue() as number;
          return (
            <div className={`text-right font-medium ${value > 100 ? "text-green-600" : "text-red-600"} flex items-center justify-end`}>
              {value.toFixed(2)}%
              {isTarget && baselineAverages && (
                <ChangeIndicator
                  current={row.roi}
                  baseline={baselineAverages.roi}
                  metric="roi"
                  sampleSize={row.approved_leads}
                />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "ctr",
        header: "CTR %",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right text-gray-700 flex items-center justify-end">
              {(info.getValue() as number).toFixed(2)}%
              {isTarget && baselineAverages && (
                <ChangeIndicator
                  current={row.ctr}
                  baseline={baselineAverages.ctr}
                  metric="ctr"
                  sampleSize={row.impressions}
                />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "cvr",
        header: "CVR %",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right text-gray-700 flex items-center justify-end">
              {(info.getValue() as number).toFixed(2)}%
              {isTarget && baselineAverages && (
                <ChangeIndicator
                  current={row.cvr}
                  baseline={baselineAverages.cvr}
                  metric="cvr"
                  sampleSize={row.clicks}
                />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "sctr",
        header: "SCTR %",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right text-gray-700 flex items-center justify-end">
              {(info.getValue() as number).toFixed(2)}%
              {isTarget && baselineAverages && (
                <ChangeIndicator
                  current={row.sctr}
                  baseline={baselineAverages.sctr}
                  metric="sctr"
                  sampleSize={row.clicks}
                />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "cotal",
        header: "COTAL %",
        cell: (info) => {
          const row = info.row.original;
          const isTarget = row.date === targetDate;
          return (
            <div className="text-right text-gray-700 flex items-center justify-end">
              {(info.getValue() as number).toFixed(2)}%
              {isTarget && baselineAverages && (
                <ChangeIndicator
                  current={row.cotal}
                  baseline={baselineAverages.cotal}
                  metric="cotal"
                  sampleSize={row.click_out}
                />
              )}
            </div>
          );
        },
      },
    ],
    [targetDate, baselineAverages]
  );

  const table = useReactTable({
    data: dailyKPIs,
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
        pageSize: 20,
      },
    },
  });

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Daily KPIs</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Performance metrics by date
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-0.5">
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                      <span className="ml-0.5">
                        {{
                          asc: <ArrowUp className="w-3 h-3 text-blue-600" />,
                          desc: <ArrowDown className="w-3 h-3 text-blue-600" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ChevronsUpDown className="w-3 h-3 text-gray-400" />
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
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getRowModel().rows.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-gray-400 text-sm">No data available</div>
        </div>
      )}

      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              First
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              Last
            </button>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-700">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <span className="text-gray-400">|</span>
            <span>
              {table.getFilteredRowModel().rows.length} rows
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
