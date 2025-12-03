"use client";

import { AnomalyResult } from "@/types";
import { TrendingDown, TrendingUp, Copy, Check, Download, FileText, FileCode } from "lucide-react";
import { useState } from "react";

interface EmailReportViewProps {
  results: AnomalyResult;
}

export default function EmailReportView({ results }: EmailReportViewProps) {
  const [copied, setCopied] = useState(false);

  // Get top 5 anomalies prioritized by severity
  const topAnomalies = results.anomalies
    .slice(0, 5)
    .filter(a => Math.abs(a.data.changePercent) >= 5);

  // Get the most critical anomaly
  const mostCritical = topAnomalies[0];

  // Calculate estimated impact (simplified)
  const estimatedImpact = mostCritical
    ? Math.abs(mostCritical.data.change * (results.metrics.revenue?.current || 0) / 100)
    : 0;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return { emoji: "🔴", label: "CRITICAL", color: "bg-red-100 text-red-900 border-red-300" };
      case "warning":
        return { emoji: "🟠", label: "WARNING", color: "bg-orange-100 text-orange-900 border-orange-300" };
      case "positive":
        return { emoji: "🟢", label: "POSITIVE", color: "bg-green-100 text-green-900 border-green-300" };
      default:
        return { emoji: "⚪", label: "NORMAL", color: "bg-gray-100 text-gray-900 border-gray-300" };
    }
  };

  const formatValue = (metric: string, value: number) => {
    if (metric.includes('revenue') || metric.includes('cost') || metric.includes('cp') || metric.includes('ep')) {
      return `$${value.toFixed(2)}`;
    } else if (metric.includes('roi') || metric.includes('ctr') || metric.includes('cvr') || metric.includes('sctr') || metric.includes('cotal') || metric.includes('octl')) {
      return `${value.toFixed(2)}%`;
    } else {
      return value.toFixed(0);
    }
  };

  const generateEmailText = () => {
    const date = new Date(results.targetDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let email = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    email += `                 📊 Daily Anomaly Report\n`;
    email += `                 ${date}\n`;
    email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Executive Summary
    email += `Today we detected ${topAnomalies.length} significant anomal${topAnomalies.length === 1 ? 'y' : 'ies'} requiring attention.\n`;
    if (mostCritical) {
      const primaryDriver = mostCritical.breakdowns && mostCritical.breakdowns.length > 0
        ? mostCritical.breakdowns[0]
        : null;
      email += `Primary concern: ${mostCritical.metric.toUpperCase()} ${mostCritical.data.direction === 'decrease' ? 'declined' : 'increased'} ${Math.abs(mostCritical.data.changePercent).toFixed(1)}%`;
      if (primaryDriver) {
        email += ` primarily driven by ${primaryDriver.dimension} = "${primaryDriver.value}".\n`;
      } else {
        email += `.\n`;
      }
      if (estimatedImpact > 0) {
        email += `Estimated impact: ~$${estimatedImpact.toFixed(0)} in potential daily revenue.\n`;
      }
    }
    email += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Individual Anomalies
    topAnomalies.forEach((anomaly, idx) => {
      const badge = getSeverityBadge(anomaly.data.severity);
      const metricLabel = anomaly.metric.toUpperCase();
      const direction = anomaly.data.direction === 'decrease' ? 'Decrease' : 'Increase';

      email += `┌──────────────────────────────────────────────────┐\n`;
      email += `│ ${badge.emoji} ${badge.label}: ${metricLabel} ${direction}${' '.repeat(Math.max(0, 40 - badge.label.length - metricLabel.length - direction.length))}│\n`;
      email += `│                                                   │\n`;

      // Key Numbers
      const current = formatValue(anomaly.metric, anomaly.data.current);
      const previous = formatValue(anomaly.metric, anomaly.data.baseline);
      const changeSymbol = anomaly.data.changePercent > 0 ? '↑' : '↓';
      const changePercent = `${changeSymbol} ${Math.abs(anomaly.data.changePercent).toFixed(1)}%`;
      const changeAbsolute = `(${anomaly.data.change > 0 ? '+' : ''}${formatValue(anomaly.metric, anomaly.data.change)})`;

      email += `│ Current: ${current} | Previous: ${previous} | Change: ${changePercent} ${changeAbsolute}${' '.repeat(Math.max(0, 40 - current.length - previous.length - changePercent.length - changeAbsolute.length))}│\n`;
      email += `│ Period: ${results.baselinePeriod}${' '.repeat(Math.max(0, 48 - results.baselinePeriod.length))}│\n`;
      email += `│                                                   │\n`;

      // Statistical Significance
      if (anomaly.data.significance) {
        const sig = anomaly.data.significance;
        email += `│ Statistical Test: p-value = ${sig.pValue.toFixed(4)}${' '.repeat(Math.max(0, 28 - sig.pValue.toFixed(4).length))}│\n`;
        email += `│ ${sig.isSignificant ? '✓ STATISTICALLY SIGNIFICANT' : '○ Within normal variance'}${' '.repeat(Math.max(0, sig.isSignificant ? 24 : 27))}│\n`;
        email += `│                                                   │\n`;
      }

      // Root Cause Breakdown
      email += `│ Root Cause Breakdown:                             │\n`;
      if (anomaly.breakdowns && anomaly.breakdowns.length > 0) {
        anomaly.breakdowns.slice(0, 4).forEach((breakdown, bidx) => {
          const changeSymbol = breakdown.changePercent > 0 ? '+' : '';
          const isPrimary = breakdown.isPrimaryDriver ? ' ← PRIMARY DRIVER' : '';
          const line = `• ${breakdown.dimension} = "${breakdown.value}": ${changeSymbol}${breakdown.changePercent.toFixed(1)}%${isPrimary}`;
          email += `│ ${line}${' '.repeat(Math.max(0, 49 - line.length))}│\n`;
        });
      } else {
        email += `│ • No significant dimension drivers identified     │\n`;
      }
      email += `└──────────────────────────────────────────────────┘\n\n`;
    });

    email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return email;
  };

  const copyToClipboard = async () => {
    const emailText = generateEmailText();
    try {
      await navigator.clipboard.writeText(emailText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadAsText = () => {
    const emailText = generateEmailText();
    const blob = new Blob([emailText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anomaly-report-${results.targetDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsHTML = () => {
    const date = new Date(results.targetDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anomaly Report - ${date}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
      background: #f9fafb;
      font-size: 13px;
    }
    .header {
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 1.25em;
    }
    .header .date {
      margin: 6px 0 0 0;
      font-size: 0.9em;
      opacity: 0.9;
    }
    .summary {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 0.95em;
    }
    .summary h2 {
      margin: 0 0 8px 0;
      color: #1e3a8a;
      font-size: 1em;
    }
    .summary p {
      margin: 0;
      line-height: 1.5;
    }
    .anomaly {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .anomaly.critical {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .anomaly.warning {
      border-color: #f97316;
      background: #fff7ed;
    }
    .anomaly.positive {
      border-color: #10b981;
      background: #f0fdf4;
    }
    .anomaly-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .badge {
      font-size: 1.3em;
    }
    .anomaly-title {
      font-size: 0.95em;
      font-weight: bold;
      margin: 0;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .metric-card {
      background: rgba(255,255,255,0.6);
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .metric-label {
      font-size: 0.75em;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 3px;
    }
    .metric-value {
      font-size: 1.15em;
      font-weight: bold;
      color: #111827;
    }
    .metric-value.negative {
      color: #dc2626;
    }
    .metric-value.positive {
      color: #059669;
    }
    .period {
      color: #6b7280;
      margin-bottom: 8px;
      font-size: 0.85em;
    }
    .statistical {
      background: rgba(255,255,255,0.6);
      padding: 8px;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 0.85em;
    }
    .statistical strong {
      color: #1f2937;
    }
    .breakdown {
      background: rgba(255,255,255,0.6);
      padding: 8px;
      border-radius: 6px;
    }
    .breakdown h4 {
      margin: 0 0 6px 0;
      color: #111827;
      font-size: 0.85em;
    }
    .breakdown ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .breakdown li {
      padding: 4px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 0.85em;
    }
    .breakdown li:last-child {
      border-bottom: none;
    }
    .primary-driver {
      background: #fee2e2;
      color: #991b1b;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 0.75em;
      font-weight: bold;
      margin-left: 6px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Daily Anomaly Report</h1>
    <p class="date">${date}</p>
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <p>
      Today we detected <strong>${topAnomalies.length}</strong> significant anomal${topAnomalies.length === 1 ? 'y' : 'ies'} requiring attention.`;

    if (mostCritical) {
      const primaryDriver = mostCritical.breakdowns && mostCritical.breakdowns.length > 0
        ? mostCritical.breakdowns[0]
        : null;
      html += ` Primary concern: <strong>${mostCritical.metric.toUpperCase()}</strong> ${mostCritical.data.direction === 'decrease' ? 'declined' : 'increased'} <strong>${Math.abs(mostCritical.data.changePercent).toFixed(1)}%</strong>`;
      if (primaryDriver) {
        html += ` primarily driven by <strong>${primaryDriver.dimension} = "${primaryDriver.value}"</strong>.`;
      } else {
        html += `.`;
      }
      if (estimatedImpact > 0) {
        html += ` Estimated impact: <strong>~$${estimatedImpact.toFixed(0)}</strong> in potential daily revenue.`;
      }
    }
    html += `
    </p>
  </div>`;

    topAnomalies.forEach((anomaly) => {
      const badge = getSeverityBadge(anomaly.data.severity);
      const direction = anomaly.data.direction === 'decrease' ? 'Decrease' : 'Increase';

      html += `
  <div class="anomaly ${anomaly.data.severity}">
    <div class="anomaly-header">
      <span class="badge">${badge.emoji}</span>
      <h3 class="anomaly-title">${badge.label}: ${anomaly.metric.toUpperCase()} ${direction}</h3>
    </div>

    <div class="metrics">
      <div class="metric-card">
        <div class="metric-label">Current</div>
        <div class="metric-value">${formatValue(anomaly.metric, anomaly.data.current)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Previous</div>
        <div class="metric-value">${formatValue(anomaly.metric, anomaly.data.baseline)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Change</div>
        <div class="metric-value ${anomaly.data.changePercent > 0 ? 'negative' : 'positive'}">
          ${anomaly.data.changePercent > 0 ? '↑' : '↓'} ${Math.abs(anomaly.data.changePercent).toFixed(1)}%
          <div style="font-size: 0.5em; color: #6b7280; margin-top: 5px;">
            (${anomaly.data.change > 0 ? '+' : ''}${formatValue(anomaly.metric, anomaly.data.change)})
          </div>
        </div>
      </div>
    </div>

    <p class="period"><strong>Period:</strong> ${results.baselinePeriod}</p>`;

      if (anomaly.data.significance) {
        const sig = anomaly.data.significance;
        html += `
    <div class="statistical">
      <strong>Statistical Analysis:</strong> p-value = ${sig.pValue.toFixed(4)} •
      <span style="color: ${sig.isSignificant ? '#dc2626' : '#059669'};">
        ${sig.isSignificant ? '✓ STATISTICALLY SIGNIFICANT' : '○ Within normal variance'}
      </span>
    </div>`;
      }

      html += `
    <div class="breakdown">
      <h4>Root Cause Breakdown:</h4>
      <ul>`;

      if (anomaly.breakdowns && anomaly.breakdowns.length > 0) {
        anomaly.breakdowns.slice(0, 4).forEach((breakdown) => {
          html += `
        <li>
          <strong>${breakdown.dimension}</strong> = "${breakdown.value}":
          <span style="color: ${breakdown.changePercent > 0 ? '#dc2626' : '#059669'};">
            ${breakdown.changePercent > 0 ? '+' : ''}${breakdown.changePercent.toFixed(1)}%
          </span>
          ${breakdown.isPrimaryDriver ? '<span class="primary-driver">← PRIMARY DRIVER</span>' : ''}
        </li>`;
        });
      } else {
        html += `<li style="font-style: italic; color: #6b7280;">No significant dimension drivers identified</li>`;
      }

      html += `
      </ul>
    </div>
  </div>`;
    });

    html += `
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anomaly-report-${results.targetDate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = async () => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    const date = new Date(results.targetDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anomaly Report - ${date}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
      background: #f9fafb;
      font-size: 13px;
    }
    .header {
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 1.25em;
    }
    .header .date {
      margin: 6px 0 0 0;
      font-size: 0.9em;
      opacity: 0.9;
    }
    .summary {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 0.95em;
    }
    .summary h2 {
      margin: 0 0 8px 0;
      color: #1e3a8a;
      font-size: 1em;
    }
    .summary p {
      margin: 0;
      line-height: 1.5;
    }
    .anomaly {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      page-break-inside: avoid;
    }
    .anomaly.critical {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .anomaly.warning {
      border-color: #f97316;
      background: #fff7ed;
    }
    .anomaly.positive {
      border-color: #10b981;
      background: #f0fdf4;
    }
    .anomaly-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .badge {
      font-size: 1.3em;
    }
    .anomaly-title {
      font-size: 0.95em;
      font-weight: bold;
      margin: 0;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .metric-card {
      background: rgba(255,255,255,0.6);
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .metric-label {
      font-size: 0.75em;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 3px;
    }
    .metric-value {
      font-size: 1.15em;
      font-weight: bold;
      color: #111827;
    }
    .metric-value.negative {
      color: #dc2626;
    }
    .metric-value.positive {
      color: #059669;
    }
    .period {
      color: #6b7280;
      margin-bottom: 8px;
      font-size: 0.85em;
    }
    .statistical {
      background: rgba(255,255,255,0.6);
      padding: 8px;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 0.85em;
    }
    .statistical strong {
      color: #1f2937;
    }
    .breakdown {
      background: rgba(255,255,255,0.6);
      padding: 8px;
      border-radius: 6px;
    }
    .breakdown h4 {
      margin: 0 0 6px 0;
      color: #111827;
      font-size: 0.85em;
    }
    .breakdown ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .breakdown li {
      padding: 4px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 0.85em;
    }
    .breakdown li:last-child {
      border-bottom: none;
    }
    .primary-driver {
      background: #fee2e2;
      color: #991b1b;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 0.75em;
      font-weight: bold;
      margin-left: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Daily Anomaly Report</h1>
    <p class="date">${date}</p>
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <p>
      Today we detected <strong>${topAnomalies.length}</strong> significant anomal${topAnomalies.length === 1 ? 'y' : 'ies'} requiring attention.`;

    if (mostCritical) {
      const primaryDriver = mostCritical.breakdowns && mostCritical.breakdowns.length > 0
        ? mostCritical.breakdowns[0]
        : null;
      html += ` Primary concern: <strong>${mostCritical.metric.toUpperCase()}</strong> ${mostCritical.data.direction === 'decrease' ? 'declined' : 'increased'} <strong>${Math.abs(mostCritical.data.changePercent).toFixed(1)}%</strong>`;
      if (primaryDriver) {
        html += ` primarily driven by <strong>${primaryDriver.dimension} = "${primaryDriver.value}"</strong>.`;
      } else {
        html += `.`;
      }
      if (estimatedImpact > 0) {
        html += ` Estimated impact: <strong>~$${estimatedImpact.toFixed(0)}</strong> in potential daily revenue.`;
      }
    }
    html += `
    </p>
  </div>`;

    topAnomalies.forEach((anomaly) => {
      const badge = getSeverityBadge(anomaly.data.severity);
      const direction = anomaly.data.direction === 'decrease' ? 'Decrease' : 'Increase';

      html += `
  <div class="anomaly ${anomaly.data.severity}">
    <div class="anomaly-header">
      <span class="badge">${badge.emoji}</span>
      <h3 class="anomaly-title">${badge.label}: ${anomaly.metric.toUpperCase()} ${direction}</h3>
    </div>

    <div class="metrics">
      <div class="metric-card">
        <div class="metric-label">Current</div>
        <div class="metric-value">${formatValue(anomaly.metric, anomaly.data.current)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Previous</div>
        <div class="metric-value">${formatValue(anomaly.metric, anomaly.data.baseline)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Change</div>
        <div class="metric-value ${anomaly.data.changePercent > 0 ? 'negative' : 'positive'}">
          ${anomaly.data.changePercent > 0 ? '↑' : '↓'} ${Math.abs(anomaly.data.changePercent).toFixed(1)}%
          <div style="font-size: 0.5em; color: #6b7280; margin-top: 5px;">
            (${anomaly.data.change > 0 ? '+' : ''}${formatValue(anomaly.metric, anomaly.data.change)})
          </div>
        </div>
      </div>
    </div>

    <p class="period"><strong>Period:</strong> ${results.baselinePeriod}</p>`;

      if (anomaly.data.significance) {
        const sig = anomaly.data.significance;
        html += `
    <div class="statistical">
      <strong>Statistical Analysis:</strong> p-value = ${sig.pValue.toFixed(4)} •
      <span style="color: ${sig.isSignificant ? '#dc2626' : '#059669'};">
        ${sig.isSignificant ? '✓ STATISTICALLY SIGNIFICANT' : '○ Within normal variance'}
      </span>
    </div>`;
      }

      html += `
    <div class="breakdown">
      <h4>Root Cause Breakdown:</h4>
      <ul>`;

      if (anomaly.breakdowns && anomaly.breakdowns.length > 0) {
        anomaly.breakdowns.slice(0, 4).forEach((breakdown) => {
          html += `
        <li>
          <strong>${breakdown.dimension}</strong> = "${breakdown.value}":
          <span style="color: ${breakdown.changePercent > 0 ? '#dc2626' : '#059669'};">
            ${breakdown.changePercent > 0 ? '+' : ''}${breakdown.changePercent.toFixed(1)}%
          </span>
          ${breakdown.isPrimaryDriver ? '<span class="primary-driver">← PRIMARY DRIVER</span>' : ''}
        </li>`;
        });
      } else {
        html += `<li style="font-style: italic; color: #6b7280;">No significant dimension drivers identified</li>`;
      }

      html += `
      </ul>
    </div>
  </div>`;
    });

    html += `
</body>
</html>`;

    // Create a temporary element to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    // Configure PDF options
    const options = {
      margin: 0.5,
      filename: `anomaly-report-${results.targetDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate PDF and remove temp element
    html2pdf().from(tempDiv).set(options).save().then(() => {
      document.body.removeChild(tempDiv);
    });
  };

  const date = new Date(results.targetDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            📊 Daily Anomaly Report
          </h2>
          <p className="text-sm text-gray-600">{date}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={downloadAsText}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FileText className="w-3 h-3" />
            TXT
          </button>
          <button
            onClick={downloadAsHTML}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <FileCode className="w-3 h-3" />
            HTML
          </button>
          <button
            onClick={downloadAsPDF}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Download className="w-3 h-3" />
            PDF
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-3 rounded-md mb-4">
        <h3 className="font-bold text-blue-900 mb-2 text-sm">Executive Summary</h3>
        <p className="text-blue-900 leading-relaxed text-sm">
          Today we detected <strong>{topAnomalies.length}</strong> significant anomal{topAnomalies.length === 1 ? 'y' : 'ies'} requiring attention.
          {mostCritical && (
            <>
              {' '}Primary concern: <strong>{mostCritical.metric.toUpperCase()}</strong>{' '}
              {mostCritical.data.direction === 'decrease' ? 'declined' : 'increased'}{' '}
              <strong>{Math.abs(mostCritical.data.changePercent).toFixed(1)}%</strong>
              {mostCritical.breakdowns && mostCritical.breakdowns.length > 0 && (
                <>
                  {' '}primarily driven by{' '}
                  <strong>{mostCritical.breakdowns[0].dimension} = "{mostCritical.breakdowns[0].value}"</strong>
                </>
              )}.
              {estimatedImpact > 0 && (
                <>
                  {' '}Estimated impact: <strong>~${estimatedImpact.toFixed(0)}</strong> in potential daily revenue.
                </>
              )}
            </>
          )}
        </p>
      </div>

      {/* Anomaly Blocks */}
      <div className="space-y-3">
        {topAnomalies.map((anomaly, idx) => {
          const badge = getSeverityBadge(anomaly.data.severity);
          const direction = anomaly.data.direction === 'decrease' ? 'Decrease' : 'Increase';

          return (
            <div key={idx} className={`border-2 rounded-lg p-3 ${badge.color}`}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{badge.emoji}</span>
                <div>
                  <h3 className="text-sm font-bold">
                    {badge.label}: {anomaly.metric.toUpperCase()} {direction}
                  </h3>
                </div>
              </div>

              {/* Key Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <div className="bg-white bg-opacity-60 rounded-md p-2">
                  <p className="text-xs text-gray-600 font-semibold mb-0.5">Current</p>
                  <p className="text-lg font-bold">{formatValue(anomaly.metric, anomaly.data.current)}</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded-md p-2">
                  <p className="text-xs text-gray-600 font-semibold mb-0.5">Previous</p>
                  <p className="text-lg font-bold">{formatValue(anomaly.metric, anomaly.data.baseline)}</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded-md p-2">
                  <p className="text-xs text-gray-600 font-semibold mb-0.5">Change</p>
                  <p className={`text-lg font-bold flex items-center gap-1 ${anomaly.data.changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {anomaly.data.changePercent > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(anomaly.data.changePercent).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    ({anomaly.data.change > 0 ? '+' : ''}{formatValue(anomaly.metric, anomaly.data.change)})
                  </p>
                </div>
              </div>

              {/* Time Period */}
              <p className="text-xs text-gray-700 mb-2">
                <strong>Period:</strong> {results.baselinePeriod}
              </p>

              {/* Statistical Significance */}
              {anomaly.data.significance && (
                <div className="bg-white bg-opacity-60 rounded-md p-2 mb-2">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">Statistical Analysis:</p>
                  <p className="text-xs text-gray-600">
                    p-value = {anomaly.data.significance.pValue.toFixed(4)}
                    {' • '}
                    <span className={anomaly.data.significance.isSignificant ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {anomaly.data.significance.isSignificant ? '✓ STATISTICALLY SIGNIFICANT' : '○ Within normal variance'}
                    </span>
                  </p>
                </div>
              )}

              {/* Root Cause Breakdown */}
              <div className="bg-white bg-opacity-60 rounded-md p-2">
                <h4 className="font-bold text-gray-900 mb-1.5 text-xs">Root Cause Breakdown:</h4>
                {anomaly.breakdowns && anomaly.breakdowns.length > 0 ? (
                  <ul className="space-y-1">
                    {anomaly.breakdowns.slice(0, 4).map((breakdown, bidx) => (
                      <li key={bidx} className="flex items-center gap-1.5 text-xs">
                        <span className="text-sm">•</span>
                        <span className="flex-1">
                          <strong>{breakdown.dimension}</strong> = "{breakdown.value}":{' '}
                          <span className={breakdown.changePercent > 0 ? 'text-red-600' : 'text-green-600'}>
                            {breakdown.changePercent > 0 ? '+' : ''}{breakdown.changePercent.toFixed(1)}%
                          </span>
                          {breakdown.isPrimaryDriver && (
                            <span className="ml-1 text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                              ← PRIMARY
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 italic text-xs">No significant dimension drivers identified</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
