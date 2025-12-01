import { MetricData, Metrics, RawDataRow, DimensionBreakdown } from "@/types";

export interface AggregatedData {
  impressions: number;
  clicks: number;
  cost: number;
  revenue: number;
  approvedLeads: number;
  clickOuts: number;
  leads: number;
}

export function aggregateData(rows: RawDataRow[]): AggregatedData {
  return rows.reduce(
    (acc, row) => ({
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      cost: acc.cost + row.cost,
      revenue: acc.revenue + row.revenue,
      approvedLeads: acc.approvedLeads + row.approved_leads,
      clickOuts: acc.clickOuts + row.click_out,
      leads: acc.leads + row.lead,
    }),
    {
      impressions: 0,
      clicks: 0,
      cost: 0,
      revenue: 0,
      approvedLeads: 0,
      clickOuts: 0,
      leads: 0,
    }
  );
}

export function calculateMetricValue(
  metricName: string,
  data: AggregatedData
): number {
  switch (metricName) {
    case "cpc":
      return data.clicks > 0 ? data.cost / data.clicks : 0;
    case "cpal":
      return data.approvedLeads > 0 ? data.cost / data.approvedLeads : 0;
    case "cpoc":
      return data.clickOuts > 0 ? data.cost / data.clickOuts : 0;
    case "cpl":
      return data.leads > 0 ? data.cost / data.leads : 0;
    case "roi":
      return data.cost > 0 ? (data.revenue / data.cost) * 100 : 0;
    case "revenue":
      return data.revenue;
    case "ctr":
      return data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
    case "cvr":
      return data.clicks > 0 ? (data.approvedLeads / data.clicks) * 100 : 0;
    case "sctr":
      return data.clicks > 0 ? (data.clickOuts / data.clicks) * 100 : 0;
    case "cotal":
      return data.clickOuts > 0 ? (data.approvedLeads / data.clickOuts) * 100 : 0;
    case "epoc":
      return data.clickOuts > 0 ? data.revenue / data.clickOuts : 0;
    case "epl":
      return data.leads > 0 ? data.revenue / data.leads : 0;
    case "epal":
      return data.approvedLeads > 0 ? data.revenue / data.approvedLeads : 0;
    case "octl":
      return data.clickOuts > 0 ? (data.leads / data.clickOuts) * 100 : 0;
    case "clicks":
      return data.clicks;
    case "impressions":
      return data.impressions;
    case "approvedLeads":
      return data.approvedLeads;
    case "clickOuts":
      return data.clickOuts;
    default:
      return 0;
  }
}

export function isMetricBetterWhenLower(metricName: string): boolean {
  const lowerIsBetter = ["cpc", "cpal", "cpoc", "cpl"];
  return lowerIsBetter.includes(metricName);
}

export function calculateMetricData(
  metricName: string,
  currentData: AggregatedData,
  baselineData: AggregatedData
): MetricData {
  const current = calculateMetricValue(metricName, currentData);
  const baseline = calculateMetricValue(metricName, baselineData);
  const change = current - baseline;
  const changePercent = baseline !== 0 ? (change / baseline) * 100 : 0;

  const direction: "increase" | "decrease" | "stable" =
    Math.abs(changePercent) < 1
      ? "stable"
      : changePercent > 0
      ? "increase"
      : "decrease";

  const severity = determineSeverity(
    metricName,
    changePercent,
    direction
  );

  return {
    current,
    baseline,
    change,
    changePercent,
    severity,
    direction,
  };
}

export function determineSeverity(
  metricName: string,
  changePercent: number,
  direction: "increase" | "decrease" | "stable"
): "critical" | "warning" | "positive" | "normal" {
  const absChange = Math.abs(changePercent);

  if (absChange < 5) {
    return "normal";
  }

  const lowerIsBetter = isMetricBetterWhenLower(metricName);
  const isGoodChange =
    (lowerIsBetter && direction === "decrease") ||
    (!lowerIsBetter && direction === "increase");

  if (isGoodChange) {
    return "positive";
  }

  if (absChange >= 10) {
    return "critical";
  }

  if (absChange >= 5) {
    return "warning";
  }

  return "normal";
}

export function calculateAllMetrics(
  currentData: AggregatedData,
  baselineData: AggregatedData
): Metrics {
  const metricNames = [
    "cpc",
    "cpal",
    "cpoc",
    "cpl",
    "roi",
    "revenue",
    "ctr",
    "cvr",
    "sctr",
    "cotal",
    "epoc",
    "epl",
    "epal",
    "octl",
    "clicks",
    "impressions",
    "approvedLeads",
    "clickOuts",
  ];

  const metrics: any = {};

  metricNames.forEach((metricName) => {
    metrics[metricName] = calculateMetricData(
      metricName,
      currentData,
      baselineData
    );
  });

  return metrics as Metrics;
}

export function analyzeDimensionBreakdown(
  metricName: string,
  currentRows: RawDataRow[],
  baselineRows: RawDataRow[],
  dimension: keyof RawDataRow,
  baselineDaysCount: number = 1
): DimensionBreakdown[] {
  const currentByDimension = new Map<string, AggregatedData>();
  const baselineByDimension = new Map<string, AggregatedData>();

  currentRows.forEach((row) => {
    const key = String(row[dimension]);
    if (!currentByDimension.has(key)) {
      currentByDimension.set(key, {
        impressions: 0,
        clicks: 0,
        cost: 0,
        revenue: 0,
        approvedLeads: 0,
        clickOuts: 0,
        leads: 0,
      });
    }
    const data = currentByDimension.get(key)!;
    data.impressions += row.impressions;
    data.clicks += row.clicks;
    data.cost += row.cost;
    data.revenue += row.revenue;
    data.approvedLeads += row.approved_leads;
    data.clickOuts += row.click_out;
    data.leads += row.lead;
  });

  baselineRows.forEach((row) => {
    const key = String(row[dimension]);
    if (!baselineByDimension.has(key)) {
      baselineByDimension.set(key, {
        impressions: 0,
        clicks: 0,
        cost: 0,
        revenue: 0,
        approvedLeads: 0,
        clickOuts: 0,
        leads: 0,
      });
    }
    const data = baselineByDimension.get(key)!;
    data.impressions += row.impressions;
    data.clicks += row.clicks;
    data.cost += row.cost;
    data.revenue += row.revenue;
    data.approvedLeads += row.approved_leads;
    data.clickOuts += row.click_out;
    data.leads += row.lead;
  });

  const breakdowns: DimensionBreakdown[] = [];

  currentByDimension.forEach((currentData, key) => {
    const baselineDataTotal = baselineByDimension.get(key) || {
      impressions: 0,
      clicks: 0,
      cost: 0,
      revenue: 0,
      approvedLeads: 0,
      clickOuts: 0,
      leads: 0,
    };

    // Average the baseline data per day
    const baselineData = {
      impressions: baselineDataTotal.impressions / baselineDaysCount,
      clicks: baselineDataTotal.clicks / baselineDaysCount,
      cost: baselineDataTotal.cost / baselineDaysCount,
      revenue: baselineDataTotal.revenue / baselineDaysCount,
      approvedLeads: baselineDataTotal.approvedLeads / baselineDaysCount,
      clickOuts: baselineDataTotal.clickOuts / baselineDaysCount,
      leads: baselineDataTotal.leads / baselineDaysCount,
    };

    const current = calculateMetricValue(metricName, currentData);
    const baseline = calculateMetricValue(metricName, baselineData);
    const change = current - baseline;
    const changePercent = baseline !== 0 ? (change / baseline) * 100 : 0;

    if (Math.abs(changePercent) >= 5) {
      breakdowns.push({
        dimension: String(dimension),
        value: key,
        changePercent,
        isPrimaryDriver: false,
      });
    }
  });

  breakdowns.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  if (breakdowns.length > 0) {
    breakdowns[0].isPrimaryDriver = true;
  }

  return breakdowns.slice(0, 4);
}
