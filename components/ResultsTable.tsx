"use client";

import { AnomalyResult, MetricData } from "@/types";
import { ArrowUp, ArrowDown, Minus, Download } from "lucide-react";

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
  const downloadAnomaliesHTML = () => {
    // Generate HTML content
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anomaly Detection Report - ${results.targetDate}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      padding: 2rem;
      color: #111827;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .header p {
      font-size: 0.875rem;
      color: #6b7280;
    }
    .alert {
      margin-top: 1rem;
      padding: 0.75rem;
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 0.375rem;
    }
    .alert p {
      font-size: 0.875rem;
      font-weight: 500;
      color: #92400e;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead {
      background-color: #f9fafb;
    }
    th {
      padding: 0.75rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e5e7eb;
    }
    td {
      padding: 0.75rem;
      font-size: 0.875rem;
      border-bottom: 1px solid #f3f4f6;
    }
    tbody tr:hover {
      background-color: #f9fafb;
    }
    .metric-name {
      font-weight: 500;
      color: #111827;
    }
    .change-positive {
      color: #16a34a;
      font-weight: 500;
    }
    .change-negative {
      color: #dc2626;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-critical {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .badge-warning {
      background-color: #ffedd5;
      color: #9a3412;
    }
    .badge-positive {
      background-color: #dcfce7;
      color: #166534;
    }
    .badge-normal {
      background-color: #f3f4f6;
      color: #374151;
    }
    .anomaly-section {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }
    .anomaly-section h3 {
      font-size: 1rem;
      font-weight: bold;
      color: #111827;
      margin-bottom: 1rem;
    }
    .anomaly-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .anomaly-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .anomaly-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }
    .anomaly-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }
    .metric-label {
      color: #6b7280;
    }
    .metric-value {
      font-weight: 500;
    }
    .breakdown {
      margin-top: 0.75rem;
    }
    .breakdown h5 {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }
    .breakdown ul {
      list-style: none;
      font-size: 0.875rem;
    }
    .breakdown li {
      padding: 0.25rem 0;
      color: #6b7280;
    }
    .breakdown li.primary {
      font-weight: 500;
      color: #111827;
    }
    .primary-tag {
      color: #dc2626;
      font-size: 0.75rem;
      margin-left: 0.25rem;
    }
    .footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
      font-size: 0.75rem;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Analysis Results</h1>
      <p>Target: ${results.targetDate} | Baseline: ${results.baselinePeriod}</p>
      ${results.anomalies.length > 0 ? `
        <div class="alert">
          <p>Detected ${results.anomalies.length} anomaly(ies) requiring attention</p>
        </div>
      ` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Current</th>
          <th>Baseline</th>
          <th>Change</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(results.metrics).map(([metricName, data]) => `
          <tr>
            <td class="metric-name">${METRIC_LABELS[metricName] || metricName}</td>
            <td>${formatValue(data.current, METRIC_FORMATS[metricName] || "#")}</td>
            <td style="color: #6b7280;">${formatValue(data.baseline, METRIC_FORMATS[metricName] || "#")}</td>
            <td class="${data.severity === 'positive' ? 'change-positive' : (data.severity === 'critical' || data.severity === 'warning') ? 'change-negative' : ''}">
              ${data.direction === 'increase' ? '↑' : data.direction === 'decrease' ? '↓' : '−'} ${Math.abs(data.changePercent).toFixed(2)}%
            </td>
            <td>
              <span class="badge badge-${data.severity}">
                ${data.severity === 'critical' ? '🔴 CRITICAL' :
                  data.severity === 'warning' ? '🟠 WARNING' :
                  data.severity === 'positive' ? '🟢 POSITIVE' : 'Normal'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${results.anomalies.length > 0 ? `
      <div class="anomaly-section">
        <h3>Anomaly Breakdown</h3>
        ${results.anomalies.map(anomaly => `
          <div class="anomaly-card">
            <div class="anomaly-header">
              <div class="anomaly-title">${METRIC_LABELS[anomaly.metric] || anomaly.metric}</div>
              <span class="badge badge-${anomaly.data.severity}">
                ${anomaly.data.severity === 'critical' ? '🔴 CRITICAL' :
                  anomaly.data.severity === 'warning' ? '🟠 WARNING' :
                  anomaly.data.severity === 'positive' ? '🟢 POSITIVE' : 'Normal'}
              </span>
            </div>

            <div class="anomaly-metrics">
              <div>
                <span class="metric-label">Current: </span>
                <span class="metric-value">${formatValue(anomaly.data.current, METRIC_FORMATS[anomaly.metric] || "#")}</span>
              </div>
              <div>
                <span class="metric-label">Baseline: </span>
                <span class="metric-value">${formatValue(anomaly.data.baseline, METRIC_FORMATS[anomaly.metric] || "#")}</span>
              </div>
              <div>
                <span class="metric-label">Change: </span>
                <span class="metric-value ${anomaly.data.severity === 'positive' ? 'change-positive' : 'change-negative'}">
                  ${anomaly.data.changePercent > 0 ? '+' : ''}${anomaly.data.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            ${anomaly.breakdowns.length > 0 ? `
              <div class="breakdown">
                <h5>Root Cause:</h5>
                <ul>
                  ${anomaly.breakdowns.map(breakdown => `
                    <li class="${breakdown.isPrimaryDriver ? 'primary' : ''}">
                      ${breakdown.value} (${breakdown.dimension}): ${breakdown.changePercent > 0 ? '+' : ''}${breakdown.changePercent.toFixed(2)}%
                      ${breakdown.isPrimaryDriver ? '<span class="primary-tag">← PRIMARY</span>' : ''}
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="footer">
      <p>Report generated on ${new Date().toLocaleString()}</p>
      <p>Anomalies detected: ${results.anomalies.length}</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anomaly-report-${results.targetDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">Analysis Results</h2>
          {results.anomalies.length > 0 && (
            <button
              onClick={downloadAnomaliesHTML}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download HTML Report</span>
            </button>
          )}
        </div>
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
