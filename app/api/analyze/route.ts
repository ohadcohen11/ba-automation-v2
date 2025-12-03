import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { executeQuery, buildDailyStatsQuery } from "@/lib/trino";
import {
  aggregateData,
  calculateAllMetrics,
  analyzeDimensionBreakdown,
} from "@/lib/metrics";
import { RawDataRow, AnomalyResult, DecisionNode } from "@/types";

export async function POST(request: NextRequest) {
  const { targetDate, baselineDays, advertiserIds } = await request.json();

  // Check if client wants streaming progress updates
  const wantsProgress = request.headers.get('accept')?.includes('text/event-stream');

  if (wantsProgress) {
    // Return streaming response with progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendProgress = (step: string, message: string) => {
            const data = `data: ${JSON.stringify({ step, message })}\n\n`;
            controller.enqueue(encoder.encode(data));
          };

          sendProgress('connect', 'Connecting to Trino database...');

          sendProgress('query', 'Fetching data from fact_publishers and fact_tracks...');
          const target = new Date(targetDate);
          const baselineStart = subDays(target, baselineDays);
          const startDate = format(baselineStart, "yyyy-MM-dd");
          const endDate = format(target, "yyyy-MM-dd");
          const query = buildDailyStatsQuery(advertiserIds, startDate, endDate);
          const rawData = await executeQuery<RawDataRow>(query);

          sendProgress('aggregate', 'Aggregating data and calculating baseline...');
          const targetDateStr = format(target, "yyyy-MM-dd");
          const currentRows = rawData.filter(
            (row) => row.stats_date_tz === targetDateStr
          );
          const baselineRows = rawData.filter(
            (row) => row.stats_date_tz !== targetDateStr
          );
          const uniqueBaselineDays = new Set(
            baselineRows.map((row) => row.stats_date_tz)
          ).size;
          const currentData = aggregateData(currentRows);
          const baselineDataTotal = aggregateData(baselineRows);
          const baselineData = {
            impressions: baselineDataTotal.impressions / uniqueBaselineDays,
            clicks: baselineDataTotal.clicks / uniqueBaselineDays,
            cost: baselineDataTotal.cost / uniqueBaselineDays,
            revenue: baselineDataTotal.revenue / uniqueBaselineDays,
            approvedLeads: baselineDataTotal.approvedLeads / uniqueBaselineDays,
            clickOuts: baselineDataTotal.clickOuts / uniqueBaselineDays,
            leads: baselineDataTotal.leads / uniqueBaselineDays,
          };

          sendProgress('metrics', 'Calculating all metrics (CPC, CVR, ROI, etc.)...');
          const metrics = calculateAllMetrics(currentData, baselineData);

          sendProgress('stats', 'Performing statistical significance tests...');
          // Statistical tests are already done in calculateAllMetrics

          sendProgress('breakdowns', 'Analyzing dimension breakdowns...');
          const anomalies = Object.entries(metrics)
            .filter(
              ([_, data]) =>
                data.severity === "critical" ||
                data.severity === "warning" ||
                data.severity === "positive"
            )
            .map(([metricName, data]) => ({
              metric: metricName,
              data,
              breakdowns: [
                ...analyzeDimensionBreakdown(
                  metricName,
                  currentRows,
                  baselineRows,
                  "device",
                  uniqueBaselineDays
                ),
                ...analyzeDimensionBreakdown(
                  metricName,
                  currentRows,
                  baselineRows,
                  "account_name",
                  uniqueBaselineDays
                ),
                ...analyzeDimensionBreakdown(
                  metricName,
                  currentRows,
                  baselineRows,
                  "campaign_quality",
                  uniqueBaselineDays
                ),
                ...analyzeDimensionBreakdown(
                  metricName,
                  currentRows,
                  baselineRows,
                  "page",
                  uniqueBaselineDays
                ),
              ]
                .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
                .slice(0, 4),
            }))
            .sort((a, b) => {
              const severityOrder: Record<string, number> = { critical: 3, warning: 2, positive: 1, normal: 0 };
              return (severityOrder[b.data.severity] || 0) - (severityOrder[a.data.severity] || 0);
            });

          sendProgress('tree', 'Generating decision tree path...');
          const decisionTree = buildDecisionTree(metrics, anomalies);

          sendProgress('complete', 'Analysis complete!');

          const result: AnomalyResult = {
            targetDate: targetDateStr,
            baselinePeriod: `${startDate} to ${endDate}`,
            metrics,
            anomalies,
            decisionTree,
            rawData: {
              current: currentRows,
              baseline: baselineRows,
            },
          };

          // Send final result
          const finalData = `data: ${JSON.stringify({ step: 'result', data: result })}\n\n`;
          controller.enqueue(encoder.encode(finalData));
          controller.close();
        } catch (error) {
          console.error("Error analyzing data:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          const errorData = `data: ${JSON.stringify({ step: 'error', message: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Regular non-streaming response
  try {

    const target = new Date(targetDate);
    const baselineStart = subDays(target, baselineDays);

    const startDate = format(baselineStart, "yyyy-MM-dd");
    const endDate = format(target, "yyyy-MM-dd");

    const query = buildDailyStatsQuery(advertiserIds, startDate, endDate);
    const rawData = await executeQuery<RawDataRow>(query);

    const targetDateStr = format(target, "yyyy-MM-dd");
    const currentRows = rawData.filter(
      (row) => row.stats_date_tz === targetDateStr
    );
    const baselineRows = rawData.filter(
      (row) => row.stats_date_tz !== targetDateStr
    );

    // Calculate number of unique baseline days
    const uniqueBaselineDays = new Set(
      baselineRows.map((row) => row.stats_date_tz)
    ).size;

    const currentData = aggregateData(currentRows);
    const baselineDataTotal = aggregateData(baselineRows);

    // Average the baseline data per day
    const baselineData = {
      impressions: baselineDataTotal.impressions / uniqueBaselineDays,
      clicks: baselineDataTotal.clicks / uniqueBaselineDays,
      cost: baselineDataTotal.cost / uniqueBaselineDays,
      revenue: baselineDataTotal.revenue / uniqueBaselineDays,
      approvedLeads: baselineDataTotal.approvedLeads / uniqueBaselineDays,
      clickOuts: baselineDataTotal.clickOuts / uniqueBaselineDays,
      leads: baselineDataTotal.leads / uniqueBaselineDays,
    };

    const metrics = calculateAllMetrics(currentData, baselineData);

    const anomalies = Object.entries(metrics)
      .filter(
        ([_, data]) =>
          data.severity === "critical" ||
          data.severity === "warning" ||
          data.severity === "positive"
      )
      .map(([metricName, data]) => ({
        metric: metricName,
        data,
        breakdowns: [
          ...analyzeDimensionBreakdown(
            metricName,
            currentRows,
            baselineRows,
            "device",
            uniqueBaselineDays
          ),
          ...analyzeDimensionBreakdown(
            metricName,
            currentRows,
            baselineRows,
            "account_name",
            uniqueBaselineDays
          ),
          ...analyzeDimensionBreakdown(
            metricName,
            currentRows,
            baselineRows,
            "campaign_quality",
            uniqueBaselineDays
          ),
          ...analyzeDimensionBreakdown(
            metricName,
            currentRows,
            baselineRows,
            "page",
            uniqueBaselineDays
          ),
        ]
          .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
          .slice(0, 4),
      }))
      .sort((a, b) => {
        const severityOrder: Record<string, number> = { critical: 3, warning: 2, positive: 1, normal: 0 };
        return (severityOrder[b.data.severity] || 0) - (severityOrder[a.data.severity] || 0);
      });

    const decisionTree = buildDecisionTree(metrics, anomalies);

    const result: AnomalyResult = {
      targetDate: targetDateStr,
      baselinePeriod: `${startDate} to ${endDate}`,
      metrics,
      anomalies,
      decisionTree,
      rawData: {
        current: currentRows,
        baseline: baselineRows,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      { error: `Failed to analyze data: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function buildDecisionTree(metrics: any, anomalies: any[]): DecisionNode {
  const hasROASDecline =
    metrics.roi.severity === "critical" || metrics.roi.severity === "warning";

  const root: DecisionNode = {
    id: "root",
    type: "metric",
    label: "ROAS Decline",
    value: `${metrics.roi.changePercent.toFixed(2)}%`,
    passed: hasROASDecline,
    children: [],
  };

  if (!hasROASDecline) {
    return root;
  }

  const hasCPAIncrease =
    metrics.cpal.severity === "critical" || metrics.cpal.severity === "warning";
  const hasEPADecrease =
    metrics.epa && (metrics.epa.severity === "critical" || metrics.epa.severity === "warning");

  if (hasCPAIncrease) {
    const cpaNode: DecisionNode = {
      id: "cpa-increase",
      type: "metric",
      label: "CPA Increase",
      value: `${metrics.cpal.changePercent.toFixed(2)}%`,
      passed: true,
      children: [],
    };

    const hasCPCIncrease =
      metrics.cpc.severity === "critical" || metrics.cpc.severity === "warning";
    const hasCVRDecrease =
      metrics.cotal.severity === "critical" ||
      metrics.cotal.severity === "warning";

    if (hasCPCIncrease) {
      cpaNode.children?.push({
        id: "cpc-increase",
        type: "metric",
        label: "CPC Increase",
        value: `${metrics.cpc.changePercent.toFixed(2)}%`,
        passed: true,
      });
    }

    if (hasCVRDecrease) {
      cpaNode.children?.push({
        id: "cvr-decrease",
        type: "metric",
        label: "CVR Decrease (COTAL)",
        value: `${metrics.cotal.changePercent.toFixed(2)}%`,
        passed: true,
      });
    }

    root.children?.push(cpaNode);
  }

  if (hasEPADecrease) {
    root.children?.push({
      id: "epa-decrease",
      type: "metric",
      label: "EPA Decrease",
      value: `${metrics.epa.changePercent.toFixed(2)}%`,
      passed: true,
    });
  }

  return root;
}
