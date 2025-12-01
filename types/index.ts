export interface MetricData {
  current: number;
  baseline: number;
  change: number;
  changePercent: number;
  severity: "critical" | "warning" | "positive" | "normal";
  direction: "increase" | "decrease" | "stable";
}

export interface Metrics {
  // Cost metrics (lower is better)
  cpc: MetricData;
  cpal: MetricData;
  cpoc: MetricData;
  cpl: MetricData;

  // Performance metrics (higher is better)
  roi: MetricData;
  revenue: MetricData;
  ctr: MetricData;
  cvr: MetricData;
  sctr: MetricData;
  cotal: MetricData;
  epoc: MetricData;
  epl: MetricData;
  epal: MetricData;
  octl: MetricData;

  // Volume metrics
  clicks: MetricData;
  impressions: MetricData;
  approvedLeads: MetricData;
  clickOuts: MetricData;
}

export interface DimensionBreakdown {
  dimension: string;
  value: string;
  changePercent: number;
  isPrimaryDriver: boolean;
}

export interface DecisionNode {
  id: string;
  type: "condition" | "action" | "metric";
  label: string;
  value?: string | number;
  passed?: boolean;
  children?: DecisionNode[];
}

export interface AnomalyResult {
  targetDate: string;
  baselinePeriod: string;
  metrics: Metrics;
  anomalies: {
    metric: string;
    data: MetricData;
    breakdowns: DimensionBreakdown[];
  }[];
  decisionTree: DecisionNode;
  rawData: {
    current: RawDataRow[];
    baseline: RawDataRow[];
  };
}

export interface RawDataRow {
  stats_date_tz: string;
  s_advertiser_name: string;
  advertiser_name: string;
  account_name: string;
  publisher_name: string;
  campaign_quality: string;
  page: string;
  campaign_segment: string;
  campaign_name: string;
  ad_group_name: string;
  device: string;
  keyword_name: string;
  match_type: string;
  impressions: number;
  clicks: number;
  cost: number;
  revenue: number;
  lead: number;
  sale: number;
  approved_leads: number;
  approved_sales: number;
  click_out: number;
}
