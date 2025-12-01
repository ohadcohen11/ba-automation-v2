"use client";

import { useState } from "react";
import { RawDataRow } from "@/types";
import { ArrowUp, ArrowDown } from "lucide-react";

interface DataTableViewProps {
  data: RawDataRow[];
  targetDate: string;
}

type SortField = keyof RawDataRow;
type SortDirection = "asc" | "desc";

export default function DataTableView({ data, targetDate }: DataTableViewProps) {
  const [sortField, setSortField] = useState<SortField>("cost");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterText, setFilterText] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredData = data.filter((row) => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      row.account_name?.toLowerCase().includes(searchLower) ||
      row.campaign_name?.toLowerCase().includes(searchLower) ||
      row.device?.toLowerCase().includes(searchLower) ||
      row.publisher_name?.toLowerCase().includes(searchLower)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal || "");
    const bStr = String(bVal || "");
    return sortDirection === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 inline ml-1" />
    );
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Calculate metrics for each row
  const dataWithMetrics = sortedData.map((row) => {
    const cpc = row.clicks > 0 ? row.cost / row.clicks : 0;
    const cpal = row.approved_leads > 0 ? row.cost / row.approved_leads : 0;
    const roi = row.cost > 0 ? (row.revenue / row.cost) * 100 : 0;
    const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
    const cvr = row.clicks > 0 ? (row.approved_leads / row.clicks) * 100 : 0;
    const sctr = row.clicks > 0 ? (row.click_out / row.clicks) * 100 : 0;
    const cotal = row.click_out > 0 ? (row.approved_leads / row.click_out) * 100 : 0;

    return {
      ...row,
      cpc,
      cpal,
      roi,
      ctr,
      cvr,
      sctr,
      cotal,
    };
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Data Table</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {sortedData.length} rows for {targetDate}
          </p>
          <input
            type="text"
            placeholder="Filter by account, campaign, device..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th
                onClick={() => handleSort("account_name")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Account <SortIcon field="account_name" />
              </th>
              <th
                onClick={() => handleSort("publisher_name")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Publisher <SortIcon field="publisher_name" />
              </th>
              <th
                onClick={() => handleSort("device")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Device <SortIcon field="device" />
              </th>
              <th
                onClick={() => handleSort("campaign_quality")}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Quality <SortIcon field="campaign_quality" />
              </th>
              <th
                onClick={() => handleSort("impressions")}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Impressions <SortIcon field="impressions" />
              </th>
              <th
                onClick={() => handleSort("clicks")}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Clicks <SortIcon field="clicks" />
              </th>
              <th
                onClick={() => handleSort("cost")}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Cost <SortIcon field="cost" />
              </th>
              <th
                onClick={() => handleSort("revenue")}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Revenue <SortIcon field="revenue" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPC
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROI %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                CTR %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                CVR %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                SCTR %
              </th>
              <th
                onClick={() => handleSort("approved_leads")}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Approved Leads <SortIcon field="approved_leads" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPAL
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                COTAL %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dataWithMetrics.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.account_name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.publisher_name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.device || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.campaign_quality || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatNumber(row.impressions, 0)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatNumber(row.clicks, 0)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                  ${formatNumber(row.cost)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                  ${formatNumber(row.revenue)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  ${formatNumber(row.cpc)}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-right font-medium ${
                    row.roi > 100 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatNumber(row.roi)}%
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {formatNumber(row.ctr)}%
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {formatNumber(row.cvr)}%
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {formatNumber(row.sctr)}%
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatNumber(row.approved_leads, 0)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  ${formatNumber(row.cpal)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {formatNumber(row.cotal)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No data found matching your filter criteria
        </div>
      )}
    </div>
  );
}
