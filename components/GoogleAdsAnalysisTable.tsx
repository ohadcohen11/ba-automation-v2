"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, AlertTriangle, CheckCircle, Clock, User, Zap, Activity, DollarSign, TrendingDown, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { ChangeEvent, AuctionInsightsMetrics, Anomaly, SignificantChange, CampaignMetrics, KeywordMetrics } from "@/lib/google-ads";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";

interface GoogleAdsAnalysisTableProps {
  targetDate: string;
  lookbackDays?: number;
}

interface GoogleAdsData {
  changeHistory: ChangeEvent[];
  auctionInsights: AuctionInsightsMetrics[];
  auctionInsightsReport: any[];
  campaignMetrics: CampaignMetrics[];
  keywordMetrics: KeywordMetrics[];
  anomalies: Anomaly[];
  significantChanges: SignificantChange[];
}

export default function GoogleAdsAnalysisTable({
  targetDate,
  lookbackDays = 7,
}: GoogleAdsAnalysisTableProps) {
  const [data, setData] = useState<GoogleAdsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"anomalies" | "changes" | "insights" | "metrics" | "keywords">("anomalies");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [lastFetchKey, setLastFetchKey] = useState<string>("");

  useEffect(() => {
    // Create a cache key based on targetDate and lookbackDays
    const cacheKey = `${targetDate}-${lookbackDays}`;

    // Only fetch if the cache key has changed (prevents refetching on tab switches)
    if (cacheKey !== lastFetchKey) {
      fetchGoogleAdsData();
      setLastFetchKey(cacheKey);
    }
  }, [targetDate, lookbackDays, lastFetchKey]);

  const fetchGoogleAdsData = async () => {
    setLoading(true);
    setError(null);

    // Check if target date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const startDateObj = new Date(target);
    startDateObj.setDate(startDateObj.getDate() - lookbackDays);

    console.log("🔍 Fetching Google Ads data");
    console.log("  Target Date:", targetDate);
    console.log("  Lookback Days:", lookbackDays);
    console.log("  Date Range:", startDateObj.toISOString().split('T')[0], "to", targetDate);
    console.log("  Is Future Date:", target > today);

    try {
      const response = await fetch("/api/google-ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetDate, lookbackDays }),
      });

      console.log("📡 Google Ads API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch Google Ads data");
      }

      const result = await response.json();
      console.log("📊 Google Ads Data Received:");
      console.log("  Change History:", result.changeHistory.length, "events");
      console.log("  Auction Insights:", result.auctionInsights.length, "rows");
      console.log("  Campaign Metrics:", result.campaignMetrics.length, "rows");
      console.log("  Keyword Metrics:", result.keywordMetrics.length, "keywords");
      console.log("  Anomalies:", result.anomalies.length, "detected");
      console.log("  Significant Changes:", result.significantChanges.length, "detected");

      setData(result);
    } catch (err) {
      console.error("❌ Error fetching Google Ads data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getImpressionShareColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "CRITICAL") return "text-red-600 bg-red-50 border-red-200";
    if (severity === "WARNING") return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === "CRITICAL") return <AlertTriangle className="w-4 h-4" />;
    if (severity === "WARNING") return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getChangeTypeIcon = (type: string) => {
    if (type === "BUDGET") return <DollarSign className="w-4 h-4" />;
    if (type === "BID" || type === "BID_STRATEGY") return <TrendingUp className="w-4 h-4" />;
    if (type === "SCHEDULE") return <Clock className="w-4 h-4" />;
    if (type === "TARGET_CPA") return <Activity className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const getChangeTypeColorClass = (type: string) => {
    if (type === "BUDGET") return "text-purple-600 bg-purple-50 border-purple-200";
    if (type === "BID" || type === "BID_STRATEGY") return "text-orange-600 bg-orange-50 border-orange-200";
    if (type === "SCHEDULE") return "text-blue-600 bg-blue-50 border-blue-200";
    if (type === "TARGET_CPA") return "text-green-600 bg-green-50 border-green-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  // Campaign Metrics table columns
  const campaignMetricsColumns = useMemo<ColumnDef<CampaignMetrics>[]>(
    () => [
      {
        accessorKey: "campaignName",
        header: "Campaign",
        cell: (info) => (
          <span className="text-xs text-gray-900 max-w-xs truncate block">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => (
          <span className="text-xs text-gray-700">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: "device",
        header: "Device",
        cell: (info) => (
          <span className="text-xs text-gray-700">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: "impressions",
        header: "Impressions",
        cell: (info) => (
          <span className="text-xs text-gray-900">
            {(info.getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "clicks",
        header: "Clicks",
        cell: (info) => (
          <span className="text-xs text-gray-900">
            {(info.getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: (info) => (
          <span className="text-xs text-gray-900 font-medium">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "conversions",
        header: "Conversions",
        cell: (info) => (
          <span className="text-xs text-gray-900 font-medium">
            {(info.getValue() as number).toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: "cpc",
        header: "CPC",
        cell: (info) => (
          <span className="text-xs text-blue-600 font-medium">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "cvr",
        header: "CVR",
        cell: (info) => (
          <span className="text-xs text-green-600 font-medium">
            {((info.getValue() as number) * 100).toFixed(2)}%
          </span>
        ),
      },
    ],
    []
  );

  const campaignMetricsTable = useReactTable({
    data: data?.campaignMetrics || [],
    columns: campaignMetricsColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Keyword Metrics table columns
  const keywordMetricsColumns = useMemo<ColumnDef<KeywordMetrics>[]>(
    () => [
      {
        accessorKey: "keywordText",
        header: "Keyword",
        cell: (info) => (
          <span className="text-xs text-gray-900 font-medium">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "matchType",
        header: "Match Type",
        cell: (info) => (
          <span className="text-xs text-gray-700">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: "campaignName",
        header: "Campaign",
        cell: (info) => (
          <span className="text-xs text-gray-600 max-w-xs truncate block">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "qualityScore",
        header: "QS",
        cell: (info) => {
          const score = info.getValue() as number;
          const color = score >= 7 ? "text-green-600" : score >= 5 ? "text-yellow-600" : "text-red-600";
          return (
            <span className={`text-xs font-bold ${color}`}>
              {score > 0 ? score : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "impressions",
        header: "Impr",
        cell: (info) => (
          <span className="text-xs text-gray-900">
            {(info.getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "clicks",
        header: "Clicks",
        cell: (info) => (
          <span className="text-xs text-gray-900">
            {(info.getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "ctr",
        header: "CTR",
        cell: (info) => (
          <span className="text-xs text-purple-600 font-medium">
            {(info.getValue() as number).toFixed(2)}%
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: (info) => (
          <span className="text-xs text-gray-900 font-medium">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "conversions",
        header: "Conv",
        cell: (info) => (
          <span className="text-xs text-gray-900 font-medium">
            {(info.getValue() as number).toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: "cpc",
        header: "CPC",
        cell: (info) => (
          <span className="text-xs text-blue-600 font-medium">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "cvr",
        header: "CVR",
        cell: (info) => (
          <span className="text-xs text-green-600 font-medium">
            {((info.getValue() as number) * 100).toFixed(2)}%
          </span>
        ),
      },
    ],
    []
  );

  const keywordMetricsTable = useReactTable({
    data: data?.keywordMetrics || [],
    columns: keywordMetricsColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading Google Ads data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Error Loading Google Ads Data</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            {error.includes("credentials") && (
              <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                <p className="font-semibold mb-2">Required Environment Variables:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>GOOGLE_ADS_DEVELOPER_TOKEN</li>
                  <li>GOOGLE_ADS_CLIENT_ID</li>
                  <li>GOOGLE_ADS_CLIENT_SECRET</li>
                  <li>GOOGLE_ADS_REFRESH_TOKEN</li>
                  <li>GOOGLE_ADS_CUSTOMER_ID</li>
                  <li>GOOGLE_ADS_LOGIN_CUSTOMER_ID (optional)</li>
                </ul>
              </div>
            )}
            <button
              onClick={fetchGoogleAdsData}
              className="mt-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate date range for display
  const startDateObj = new Date(targetDate);
  startDateObj.setDate(startDateObj.getDate() - lookbackDays);
  const startDateStr = startDateObj.toISOString().split('T')[0];

  // Check if future date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const isFutureDate = target > today;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Google Ads Investigation</h2>
        <p className="text-xs text-gray-600 mt-0.5">
          Analyzing: {startDateStr} to {targetDate} ({lookbackDays} days)
        </p>
        {isFutureDate && (
          <div className="mt-2 flex items-center space-x-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span>
              <strong>Note:</strong> Target date is in the future. Google Ads API may not have data for dates that haven't occurred yet.
            </span>
          </div>
        )}

        {/* Quick Summary Stats */}
        {data.anomalies.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {data.anomalies.slice(0, 3).map((anomaly, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-2.5 border ${getSeverityColor(anomaly.severity)}`}
              >
                <div className="text-[10px] font-semibold opacity-75 mb-0.5">
                  {anomaly.metric}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{anomaly.current}</span>
                  <div className={`flex items-center space-x-0.5 text-xs font-semibold ${
                    anomaly.changePercent > 0 ? "text-red-700" : "text-green-700"
                  }`}>
                    {anomaly.changePercent > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    <span>{Math.abs(anomaly.changePercent).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="text-[9px] opacity-60 mt-0.5">
                  vs baseline: {anomaly.baseline}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="border-b border-gray-200 bg-gray-50 px-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveSection("anomalies")}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors ${
              activeSection === "anomalies"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Anomalies</span>
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                data.anomalies.length > 0 ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
              }`}>
                {data.anomalies.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection("changes")}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors ${
              activeSection === "changes"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Significant Changes</span>
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                data.significantChanges.length > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-700"
              }`}>
                {data.significantChanges.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection("metrics")}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors ${
              activeSection === "metrics"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Campaign Metrics</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]">
                {data.campaignMetrics.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection("keywords")}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors ${
              activeSection === "keywords"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Keywords</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]">
                {data.keywordMetrics.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection("insights")}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors ${
              activeSection === "insights"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Auction Insights</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]">
                {data.auctionInsights.length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Anomalies Section */}
      {activeSection === "anomalies" && (
        <div className="p-4">
          {data.anomalies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">No anomalies detected</p>
              <p className="text-xs mt-1">All metrics are within expected ranges</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.anomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getSeverityIcon(anomaly.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">{anomaly.metric}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          anomaly.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {anomaly.severity}
                        </span>
                      </div>

                      <p className="text-xs mb-3">{anomaly.description}</p>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white bg-opacity-50 rounded p-2">
                          <div className="text-[10px] font-medium opacity-75 mb-0.5">Baseline</div>
                          <div className="text-sm font-bold">{anomaly.baseline}</div>
                        </div>
                        <div className="bg-white bg-opacity-50 rounded p-2">
                          <div className="text-[10px] font-medium opacity-75 mb-0.5">Current</div>
                          <div className="text-sm font-bold flex items-center space-x-1">
                            <span>{anomaly.current}</span>
                            {anomaly.changePercent !== 0 && (
                              <span className={`${
                                anomaly.changePercent > 0 ? "text-red-600" : "text-green-600"
                              }`}>
                                {anomaly.changePercent > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-50 rounded p-2">
                          <div className="text-[10px] font-medium opacity-75 mb-0.5">Change</div>
                          <div className={`text-sm font-bold flex items-center space-x-1 ${
                            anomaly.changePercent > 0 ? "text-red-700" : "text-green-700"
                          }`}>
                            {anomaly.changePercent > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span>{anomaly.changePercent > 0 ? "+" : ""}{anomaly.changePercent.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Significant Changes Section */}
      {activeSection === "changes" && (
        <div className="p-4">
          {data.significantChanges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">No significant changes detected</p>
              <p className="text-xs mt-1">No budget, bid, or schedule changes exceeded thresholds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.significantChanges.map((change, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 ${getChangeTypeColorClass(change.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getChangeTypeIcon(change.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="text-xs font-bold uppercase">{change.type.replace(/_/g, " ")}</span>
                        {change.campaignName && (
                          <span className="text-xs opacity-75">
                            • {change.campaignName}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium mb-2">{change.description}</p>

                      {(change.oldValue || change.newValue) && (
                        <div className="flex items-center space-x-3 text-xs mb-2">
                          {change.oldValue && (
                            <span className="bg-white bg-opacity-50 px-2 py-1 rounded">
                              <span className="font-medium">Old:</span> {change.oldValue}
                            </span>
                          )}
                          {change.oldValue && change.newValue && (
                            <span className="opacity-50">→</span>
                          )}
                          {change.newValue && (
                            <span className="bg-white bg-opacity-70 px-2 py-1 rounded font-medium">
                              <span>New:</span> {change.newValue}
                            </span>
                          )}
                          {change.changePercent !== undefined && (
                            <span className={`font-bold ${
                              change.changePercent > 0 ? "text-red-700" : "text-green-700"
                            }`}>
                              ({change.changePercent > 0 ? "+" : ""}{change.changePercent.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-3 text-[10px] opacity-75">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(change.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{change.user}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campaign Metrics Section */}
      {activeSection === "metrics" && (
        <div className="p-4">
          {data.campaignMetrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm">No campaign metrics available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {campaignMetricsTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center space-x-1">
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            <span className="text-gray-400">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="w-3 h-3" />
                              ) : (
                                <ChevronsUpDown className="w-3 h-3" />
                              )}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaignMetricsTable.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Showing {campaignMetricsTable.getRowModel().rows.length} of {data.campaignMetrics.length} rows
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keywords Section */}
      {activeSection === "keywords" && (
        <div className="p-4">
          {data.keywordMetrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm">No keyword metrics available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {keywordMetricsTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center space-x-1">
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            <span className="text-gray-400">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="w-3 h-3" />
                              ) : (
                                <ChevronsUpDown className="w-3 h-3" />
                              )}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywordMetricsTable.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Showing {keywordMetricsTable.getRowModel().rows.length} of {data.keywordMetrics.length} keywords
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auction Insights Section */}
      {activeSection === "insights" && (
        <div className="p-4">
          {data.auctionInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm">No auction insights data available</p>
              <p className="text-xs mt-1">This may require additional permissions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase">
                      Date
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase">
                      Impression Share
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase">
                      Top of Page
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase">
                      Absolute Top
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.auctionInsights.map((insight, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {insight.date}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span
                          className={`text-xs font-medium ${getImpressionShareColor(
                            insight.impressionShare
                          )}`}
                        >
                          {insight.impressionShare.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-700">
                        {insight.topOfPageRate.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-700">
                        {insight.absoluteTopImpressionPercentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-[10px] text-blue-600 font-semibold uppercase mb-1">
                    Avg Impression Share
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {(
                      data.auctionInsights.reduce((sum, i) => sum + i.impressionShare, 0) /
                      data.auctionInsights.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-[10px] text-purple-600 font-semibold uppercase mb-1">
                    Avg Top of Page
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {(
                      data.auctionInsights.reduce((sum, i) => sum + i.topOfPageRate, 0) /
                      data.auctionInsights.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-[10px] text-green-600 font-semibold uppercase mb-1">
                    Avg Absolute Top
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {(
                      data.auctionInsights.reduce(
                        (sum, i) => sum + i.absoluteTopImpressionPercentage,
                        0
                      ) / data.auctionInsights.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug Information */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
            🔧 Debug Information (click to expand)
          </summary>
          <div className="mt-2 space-y-2 text-[10px] font-mono">
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="text-gray-500 mb-1">Date Range:</div>
              <div className="text-gray-900">
                {startDateStr} to {targetDate} ({lookbackDays} days)
              </div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="text-gray-500 mb-1">Results:</div>
              <div className="text-gray-900">
                Anomalies: {data.anomalies.length} detected
                <br />
                Significant Changes: {data.significantChanges.length} detected
                <br />
                Campaign Metrics: {data.campaignMetrics.length} rows
                <br />
                Change History: {data.changeHistory.length} events
                <br />
                Auction Insights: {data.auctionInsights.length} rows
                <br />
                Auction Insights Report: {data.auctionInsightsReport?.length || 0} rows
              </div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="text-gray-500 mb-1">API Response (Sample):</div>
              <pre className="text-[9px] text-gray-700 overflow-auto max-h-32">
                {JSON.stringify(
                  {
                    anomalies: data.anomalies.slice(0, 2),
                    significantChanges: data.significantChanges.slice(0, 2),
                    campaignMetrics: data.campaignMetrics.slice(0, 2),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="text-gray-500 italic">
              💡 Tip: Check browser console (F12) for detailed API logs
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
