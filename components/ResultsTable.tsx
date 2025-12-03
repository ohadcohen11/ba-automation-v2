"use client";

import { AnomalyResult, MetricData } from "@/types";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ResultsTableProps {
  results: AnomalyResult;
}

const METRIC_LABELS: Record<string, string> = {
  cpc: "CPC (Cost Per Click)",
  cpal: "CPAL (Cost Per Approved Lead)",
  cpoc: "CPOC (Cost Per Click Out)",
  cpl: "CPL (Cost Per Lead)",
  roi: "ROI (Return on Investment)",
  revenue: "Revenue",
  ctr: "CTR (Click Through Rate)",
  cvr: "CVR (Conversion Rate)",
  sctr: "SCTR (Site Conversion Rate)",
  cotal: "COTAL (Click Out to Approved Lead)",
  epoc: "EPOC (Earnings Per Click Out)",
  epl: "EPL (Earnings Per Lead)",
  epal: "EPAL (Earnings Per Approved Lead)",
  octl: "OCTL (Out Click to Lead)",
  clicks: "Clicks",
  impressions: "Impressions",
  approvedLeads: "Approved Leads",
  clickOuts: "Click Outs",
};

const METRIC_FORMATS: Record<string, string> = {
  cpc: "$",
  cpal: "$",
  cpoc: "$",
  cpl: "$",
  roi: "%",
  revenue: "$",
  ctr: "%",
  cvr: "%",
  sctr: "%",
  cotal: "%",
  epoc: "$",
  epl: "$",
  epal: "$",
  octl: "%",
  clicks: "#",
  impressions: "#",
  approvedLeads: "#",
  clickOuts: "#",
};

function formatValue(value: number, format: string): string {
  if (format === "$") {
    return `$${value.toFixed(2)}`;
  }
  if (format === "%") {
    return `${value.toFixed(2)}%`;
  }
  return value.toLocaleString();
}

function getSeverityBadge(severity: string): JSX.Element {
  const badges = {
    critical: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        🔴 CRITICAL
      </span>
    ),
    warning: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        🟠 WARNING
      </span>
    ),
    positive: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        🟢 POSITIVE
      </span>
    ),
    normal: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Normal
      </span>
    ),
  };
  return badges[severity as keyof typeof badges] || badges.normal;
}

function getChangeColor(metric: MetricData): string {
  if (metric.severity === "positive") return "text-green-600";
  if (metric.severity === "critical") return "text-red-600";
  if (metric.severity === "warning") return "text-orange-600";
  return "text-gray-600";
}

function getChangeIcon(direction: string): JSX.Element {
  if (direction === "increase") return <ArrowUp className="w-4 h-4" />;
  if (direction === "decrease") return <ArrowDown className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
}

export default function ResultsTable({ results }: ResultsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Analysis Results</h2>
        <p className="text-xs text-gray-600 mt-0.5">
          Target: {results.targetDate} | Baseline: {results.baselinePeriod}
        </p>
        {results.anomalies.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs font-medium text-yellow-800">
              Detected {results.anomalies.length} anomaly(ies) requiring attention
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                Metric
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                Current
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                Baseline
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                Change
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {Object.entries(results.metrics).map(([metricName, data]) => (
              <tr key={metricName} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {METRIC_LABELS[metricName] || metricName}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {formatValue(data.current, METRIC_FORMATS[metricName] || "#")}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {formatValue(
                    data.baseline,
                    METRIC_FORMATS[metricName] || "#"
                  )}
                </td>
                <td
                  className={`px-3 py-2 whitespace-nowrap text-xs font-medium ${getChangeColor(
                    data
                  )}`}
                >
                  <div className="flex items-center space-x-0.5">
                    {getChangeIcon(data.direction)}
                    <span>{Math.abs(data.changePercent).toFixed(2)}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {getSeverityBadge(data.severity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.anomalies.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Anomaly Breakdown</h3>
          <div className="space-y-3">
            {results.anomalies.map((anomaly, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-md p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-900">
                    {METRIC_LABELS[anomaly.metric] || anomaly.metric}
                  </h4>
                  {getSeverityBadge(anomaly.data.severity)}
                </div>

                <div className="mb-2">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Current: </span>
                      <span className="font-medium">
                        {formatValue(
                          anomaly.data.current,
                          METRIC_FORMATS[anomaly.metric] || "#"
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Baseline: </span>
                      <span className="font-medium">
                        {formatValue(
                          anomaly.data.baseline,
                          METRIC_FORMATS[anomaly.metric] || "#"
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Change: </span>
                      <span
                        className={`font-medium ${getChangeColor(
                          anomaly.data
                        )}`}
                      >
                        {anomaly.data.changePercent > 0 ? "+" : ""}
                        {anomaly.data.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {anomaly.breakdowns.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-1">
                      Root Cause:
                    </h5>
                    <ul className="space-y-0.5 text-xs">
                      {anomaly.breakdowns.map((breakdown, idx) => (
                        <li
                          key={idx}
                          className={`${
                            breakdown.isPrimaryDriver
                              ? "font-medium text-gray-900"
                              : "text-gray-600"
                          }`}
                        >
                          {breakdown.value} ({breakdown.dimension}):{" "}
                          {breakdown.changePercent > 0 ? "+" : ""}
                          {breakdown.changePercent.toFixed(2)}%
                          {breakdown.isPrimaryDriver && (
                            <span className="ml-1 text-red-600 text-[10px]">
                              ← PRIMARY
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
