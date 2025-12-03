import { MetricData, Metrics, RawDataRow, DimensionBreakdown, StatisticalSignificance } from "@/types";

// Statistical constants
const Z_SCORE_CONFIDENCE = 1.96; // 95% confidence level
const MIN_SAMPLE_SIZE = 30; // Minimum sample size for statistical testing

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

/**
 * Calculate statistical significance for proportion-based metrics (rates)
 * Uses the Z-test for proportions
 */
export function calculateStatisticalSignificance(
  currentValue: number,
  baselineValue: number,
  sampleSize: number,
  metricType: 'rate' | 'value'
): StatisticalSignificance | null {
  // Only calculate for rates (percentages) and if we have enough sample size
  if (metricType !== 'rate' || sampleSize < MIN_SAMPLE_SIZE) {
    return null;
  }

  // Convert percentages to proportions (0-1)
  const P = baselineValue / 100; // Baseline proportion
  const P1 = currentValue / 100; // Current proportion

  // Edge case: if baseline is 0 or 1, we can't calculate SE
  if (P <= 0 || P >= 1) {
    return null;
  }

  // Calculate Standard Error: SE = sqrt((P * (1 - P)) / n)
  const standardError = Math.sqrt((P * (1 - P)) / sampleSize);

  // Calculate Z-Score: Z = (P1 - P) / SE
  const zScore = standardError > 0 ? (P1 - P) / standardError : 0;

  // Calculate p-value (two-tailed test)
  // Using normal distribution approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  // Calculate confidence interval (95%)
  const marginOfError = Z_SCORE_CONFIDENCE * standardError;
  const confidenceInterval = {
    lower: Math.max(0, P - marginOfError) * 100, // Convert back to percentage
    upper: Math.min(1, P + marginOfError) * 100, // Convert back to percentage
  };

  // Determine if significant (p < 0.05 for 95% confidence)
  const isSignificant = pValue < 0.05;

  return {
    standardError,
    zScore,
    pValue,
    confidenceInterval,
    isSignificant,
    sampleSize,
  };
}

/**
 * Cumulative Distribution Function for standard normal distribution
 * Approximation using the error function
 */
function normalCDF(z: number): number {
  // Using the approximation: CDF(z) ≈ 0.5 * (1 + erf(z / sqrt(2)))
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * Error function approximation (Abramowitz and Stegun)
 */
function erf(x: number): number {
  // Constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign of x
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  // Abramowitz and Stegun formula
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
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

  // Determine metric type and sample size for statistical testing
  const rateMetrics = ['ctr', 'cvr', 'sctr', 'cotal', 'octl', 'roi'];
  const metricType = rateMetrics.includes(metricName) ? 'rate' : 'value';

  // Use clicks as sample size for most rate metrics
  let sampleSize = currentData.clicks;
  if (metricName === 'ctr') {
    sampleSize = currentData.impressions;
  } else if (metricName === 'cotal' || metricName === 'octl') {
    sampleSize = currentData.clickOuts;
  }

  // Calculate statistical significance
  const significance = calculateStatisticalSignificance(
    current,
    baseline,
    sampleSize,
    metricType
  );

  return {
    current,
    baseline,
    change,
    changePercent,
    severity,
    direction,
    significance,
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

function isValidDimensionValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  const strValue = String(value).trim();
  if (strValue === "" || strValue === "-" || strValue === "null" || strValue === "undefined") return false;
  if (strValue.toLowerCase() === "unknown") return false;
  return true;
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
    const dimensionValue = row[dimension];

    // Skip rows with null/empty dimension values
    if (!isValidDimensionValue(dimensionValue)) {
      return;
    }

    const key = String(dimensionValue);
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
    const dimensionValue = row[dimension];

    // Skip rows with null/empty dimension values
    if (!isValidDimensionValue(dimensionValue)) {
      return;
    }

    const key = String(dimensionValue);
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

    // Calculate statistical significance for this breakdown
    const rateMetrics = ['ctr', 'cvr', 'sctr', 'cotal', 'octl', 'roi'];
    const metricType = rateMetrics.includes(metricName) ? 'rate' : 'value';

    // Determine sample size based on metric type
    let sampleSize = currentData.clicks;
    if (metricName === 'ctr') {
      sampleSize = currentData.impressions;
    } else if (metricName === 'cotal' || metricName === 'octl') {
      sampleSize = currentData.clickOuts;
    }

    const significance = calculateStatisticalSignificance(
      current,
      baseline,
      sampleSize,
      metricType
    );

    // Include breakdown if statistically significant OR if change >= 5% (fallback)
    const isSignificant = significance?.isSignificant ?? Math.abs(changePercent) >= 5;

    if (isSignificant) {
      breakdowns.push({
        dimension: String(dimension),
        value: key,
        changePercent,
        isPrimaryDriver: false,
        isStatisticallySignificant: significance?.isSignificant ?? false,
        pValue: significance?.pValue,
        current,
        baseline,
      });
    }
  });

  breakdowns.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  if (breakdowns.length > 0) {
    breakdowns[0].isPrimaryDriver = true;
  }

  return breakdowns.slice(0, 4);
}
