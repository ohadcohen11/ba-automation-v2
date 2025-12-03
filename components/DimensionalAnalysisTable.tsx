"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import { RawDataRow } from "@/types";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";

interface DimensionalAnalysisTableProps {
  data: RawDataRow[];
  targetDate: string;
  dimension: keyof RawDataRow;
  dimensionLabel: string;
}

interface DimensionData {
  dimensionValue: string;
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
  baselineImpressions?: number;
  baselineClicks?: number;
  baselineCost?: number;
  baselineRevenue?: number;
  baselineApprovedLeads?: number;
  baselineClickOut?: number;
  baselineCpc?: number;
  baselineCpal?: number;
  baselineCpoc?: number;
  baselineRoi?: number;
  baselineCtr?: number;
  baselineCvr?: number;
  baselineSctr?: number;
  baselineCotal?: number;
}

export default function DimensionalAnalysisTable({
  data,
  targetDate,
  dimension,
  dimensionLabel,
}: DimensionalAnalysisTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Aggregate data by dimension
  const dimensionalData = useMemo(() => {
    const currentRows = data.filter((row) => row.stats_date_tz === targetDate);
    const baselineRows = data.filter((row) => row.stats_date_tz !== targetDate);
    const baselineDaysCount = new Set(baselineRows.map((r) => r.stats_date_tz)).size || 1;

    const currentByDimension = new Map<string, any>();
    const baselineByDimension = new Map<string, any>();

    // Aggregate current data
    currentRows.forEach((row) => {
      const key = String(row[dimension] || "Unknown");
      if (!currentByDimension.has(key)) {
        currentByDimension.set(key, {
          impressions: 0,
          clicks: 0,
          cost: 0,
          revenue: 0,
          approved_leads: 0,
          click_out: 0,
        });
      }
      const agg = currentByDimension.get(key);
      agg.impressions += row.impressions;
      agg.clicks += row.clicks;
      agg.cost += row.cost;
      agg.revenue += row.revenue;
      agg.approved_leads += row.approved_leads;
      agg.click_out += row.click_out;
    });

    // Aggregate baseline data
    baselineRows.forEach((row) => {
      const key = String(row[dimension] || "Unknown");
      if (!baselineByDimension.has(key)) {
        baselineByDimension.set(key, {
          impressions: 0,
          clicks: 0,
          cost: 0,
          revenue: 0,
          approved_leads: 0,
          click_out: 0,
        });
      }
      const agg = baselineByDimension.get(key);
      agg.impressions += row.impressions;
      agg.clicks += row.clicks;
      agg.cost += row.cost;
      agg.revenue += row.revenue;
      agg.approved_leads += row.approved_leads;
      agg.click_out += row.click_out;
    });

    // Calculate metrics for each dimension value
    const result: DimensionData[] = [];

    currentByDimension.forEach((current, key) => {
      const baselineTotal = baselineByDimension.get(key) || {
        impressions: 0,
        clicks: 0,
        cost: 0,
        revenue: 0,
        approved_leads: 0,
        click_out: 0,
      };

      // Average baseline per day
      const baseline = {
        impressions: baselineTotal.impressions / baselineDaysCount,
        clicks: baselineTotal.clicks / baselineDaysCount,
        cost: baselineTotal.cost / baselineDaysCount,
        revenue: baselineTotal.revenue / baselineDaysCount,
        approved_leads: baselineTotal.approved_leads / baselineDaysCount,
        click_out: baselineTotal.click_out / baselineDaysCount,
      };

      // Calculate derived metrics
      const cpc = current.clicks > 0 ? current.cost / current.clicks : 0;
      const cpal = current.approved_leads > 0 ? current.cost / current.approved_leads : 0;
      const cpoc = current.click_out > 0 ? current.cost / current.click_out : 0;
      const roi = current.cost > 0 ? (current.revenue / current.cost) * 100 : 0;
      const ctr = current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0;
      const cvr = current.clicks > 0 ? (current.approved_leads / current.clicks) * 100 : 0;
      const sctr = current.clicks > 0 ? (current.click_out / current.clicks) * 100 : 0;
      const cotal = current.click_out > 0 ? (current.approved_leads / current.click_out) * 100 : 0;

      const baselineCpc = baseline.clicks > 0 ? baseline.cost / baseline.clicks : 0;
      const baselineCpal = baseline.approved_leads > 0 ? baseline.cost / baseline.approved_leads : 0;
      const baselineCpoc = baseline.click_out > 0 ? baseline.cost / baseline.click_out : 0;
      const baselineRoi = baseline.cost > 0 ? (baseline.revenue / baseline.cost) * 100 : 0;
      const baselineCtr = baseline.impressions > 0 ? (baseline.clicks / baseline.impressions) * 100 : 0;
      const baselineCvr = baseline.clicks > 0 ? (baseline.approved_leads / baseline.clicks) * 100 : 0;
      const baselineSctr = baseline.clicks > 0 ? (baseline.click_out / baseline.clicks) * 100 : 0;
      const baselineCotal = baseline.click_out > 0 ? (baseline.approved_leads / baseline.click_out) * 100 : 0;

      result.push({
        dimensionValue: key,
        ...current,
        cpc,
        cpal,
        cpoc,
        roi,
        ctr,
        cvr,
        sctr,
        cotal,
        baselineImpressions: baseline.impressions,
        baselineClicks: baseline.clicks,
        baselineCost: baseline.cost,
        baselineRevenue: baseline.revenue,
        baselineApprovedLeads: baseline.approved_leads,
        baselineClickOut: baseline.click_out,
        baselineCpc,
        baselineCpal,
        baselineCpoc,
        baselineRoi,
        baselineCtr,
        baselineCvr,
        baselineSctr,
        baselineCotal,
      });
    });

    return result.sort((a, b) => b.cost - a.cost);
  }, [data, targetDate, dimension]);

  const columns = useMemo<ColumnDef<DimensionData>[]>(
    () => [
      {
        accessorKey: "dimensionValue",
        header: dimensionLabel,
        cell: (info) => (
          <div className="font-medium text-gray-900">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: (info) => {
          const row = info.row.original;
          const current = info.getValue() as number;
          const baseline = row.baselineCost || 0;
          const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
          return (
            <div className="text-right">
              <div className="font-medium text-gray-900">
                ${current.toFixed(2)}
              </div>
              {baseline > 0 && (
                <div className={`text-[10px] ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "revenue",
        header: "Revenue",
        cell: (info) => {
          const row = info.row.original;
          const current = info.getValue() as number;
          const baseline = row.baselineRevenue || 0;
          const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
          return (
            <div className="text-right">
              <div className="font-medium text-gray-900">
                ${current.toFixed(2)}
              </div>
              {baseline > 0 && (
                <div className={`text-[10px] ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "roi",
        header: "ROI %",
        cell: (info) => {
          const row = info.row.original;
          const current = info.getValue() as number;
          const baseline = row.baselineRoi || 0;
          const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
          return (
            <div className="text-right">
              <div className={`font-medium ${current > 100 ? 'text-green-600' : 'text-red-600'}`}>
                {current.toFixed(2)}%
              </div>
              {baseline > 0 && (
                <div className={`text-[10px] ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "cpc",
        header: "CPC",
        cell: (info) => {
          const row = info.row.original;
          const current = info.getValue() as number;
          const baseline = row.baselineCpc || 0;
          const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
          return (
            <div className="text-right">
              <div className="text-gray-700">${current.toFixed(2)}</div>
              {baseline > 0 && (
                <div className={`text-[10px] ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "cpal",
        header: "CPAL",
        cell: (info) => {
          const row = info.row.original;
          const current = info.getValue() as number;
          const baseline = row.baselineCpal || 0;
          const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
          return (
            <div className="text-right">
              <div className="text-gray-700">${current.toFixed(2)}</div>
              {baseline > 0 && (
                <div className={`text-[10px] ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
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
          const current = info.getValue() as number;
          const baseline = row.baselineCvr || 0;
          const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
          return (
            <div className="text-right">
              <div className="text-gray-700">{current.toFixed(2)}%</div>
              {baseline > 0 && (
                <div className={`text-[10px] ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "clicks",
        header: "Clicks",
        cell: (info) => {
          const row = info.row.original;
          const current = info.getValue() as number;
          const baseline = row.baselineClicks || 0;
          const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
          return (
            <div className="text-right">
              <div className="text-gray-700">{current.toLocaleString()}</div>
              {baseline > 0 && (
                <div className={`text-[10px] ${Math.abs(change) > 20 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "approved_leads",
        header: "Approved Leads",
        cell: (info) => {
          const row = info.row.original;
          const current = info.getValue() as number;
          const baseline = row.baselineApprovedLeads || 0;
          const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
          return (
            <div className="text-right">
              <div className="text-gray-700">{current.toLocaleString()}</div>
              {baseline > 0 && (
                <div className={`text-[10px] ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [dimensionLabel]
  );

  const table = useReactTable({
    data: dimensionalData,
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
  });

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">By {dimensionLabel}</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Metrics broken down by {dimensionLabel.toLowerCase()} with baseline comparison
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
    </div>
  );
}
