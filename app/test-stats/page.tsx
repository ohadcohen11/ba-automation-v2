"use client";

import DecisionTreeView from "@/components/DecisionTreeView";
import { AnomalyResult } from "@/types";

export default function TestStatsPage() {
  // Mock data for testing
  const mockResults: AnomalyResult = {
    targetDate: "2024-12-02",
    baselinePeriod: "2024-11-15 to 2024-12-01",
    metrics: {
      cpc: {
        current: 2.35,
        baseline: 2.10,
        change: 0.25,
        changePercent: 11.9,
        severity: "critical",
        direction: "increase",
        significance: {
          standardError: 0.0048,
          zScore: 2.81,
          pValue: 0.0049,
          confidenceInterval: { lower: 2.01, upper: 2.19 },
          isSignificant: true,
          sampleSize: 4250,
        },
      },
      cvr: {
        current: 12.8,
        baseline: 14.3,
        change: -1.5,
        changePercent: -10.49,
        severity: "critical",
        direction: "decrease",
        significance: {
          standardError: 0.00476,
          zScore: -3.154,
          pValue: 0.0008,
          confidenceInterval: { lower: 13.37, upper: 15.23 },
          isSignificant: true,
          sampleSize: 5419,
        },
      },
      ctr: {
        current: 3.2,
        baseline: 3.1,
        change: 0.1,
        changePercent: 3.23,
        severity: "normal",
        direction: "increase",
        significance: {
          standardError: 0.0012,
          zScore: 0.83,
          pValue: 0.406,
          confidenceInterval: { lower: 2.87, upper: 3.33 },
          isSignificant: false,
          sampleSize: 125000,
        },
      },
      roi: {
        current: 145.2,
        baseline: 168.5,
        change: -23.3,
        changePercent: -13.83,
        severity: "critical",
        direction: "decrease",
        significance: {
          standardError: 0.0089,
          zScore: -2.62,
          pValue: 0.0088,
          confidenceInterval: { lower: 150.76, upper: 186.24 },
          isSignificant: true,
          sampleSize: 5419,
        },
      },
      sctr: {
        current: 45.6,
        baseline: 46.2,
        change: -0.6,
        changePercent: -1.3,
        severity: "normal",
        direction: "decrease",
        significance: {
          standardError: 0.0067,
          zScore: -0.09,
          pValue: 0.928,
          confidenceInterval: { lower: 44.89, upper: 47.51 },
          isSignificant: false,
          sampleSize: 5419,
        },
      },
      cpal: {
        current: 18.36,
        baseline: 14.68,
        change: 3.68,
        changePercent: 25.07,
        severity: "critical",
        direction: "increase",
      },
      cpoc: {
        current: 4.52,
        baseline: 4.23,
        change: 0.29,
        changePercent: 6.86,
        severity: "warning",
        direction: "increase",
      },
      cpl: {
        current: 12.45,
        baseline: 11.89,
        change: 0.56,
        changePercent: 4.71,
        severity: "normal",
        direction: "increase",
      },
      revenue: {
        current: 12500.0,
        baseline: 11800.0,
        change: 700.0,
        changePercent: 5.93,
        severity: "positive",
        direction: "increase",
      },
      cotal: {
        current: 52.3,
        baseline: 54.1,
        change: -1.8,
        changePercent: -3.33,
        severity: "normal",
        direction: "decrease",
      },
      epoc: {
        current: 5.06,
        baseline: 4.78,
        change: 0.28,
        changePercent: 5.86,
        severity: "positive",
        direction: "increase",
      },
      epl: {
        current: 7.89,
        baseline: 7.23,
        change: 0.66,
        changePercent: 9.13,
        severity: "positive",
        direction: "increase",
      },
      epal: {
        current: 15.23,
        baseline: 14.56,
        change: 0.67,
        changePercent: 4.60,
        severity: "normal",
        direction: "increase",
      },
      octl: {
        current: 34.5,
        baseline: 36.2,
        change: -1.7,
        changePercent: -4.70,
        severity: "normal",
        direction: "decrease",
      },
      clicks: {
        current: 5419,
        baseline: 5200,
        change: 219,
        changePercent: 4.21,
        severity: "normal",
        direction: "increase",
      },
      impressions: {
        current: 169344,
        baseline: 167742,
        change: 1602,
        changePercent: 0.95,
        severity: "normal",
        direction: "increase",
      },
      approvedLeads: {
        current: 694,
        baseline: 744,
        change: -50,
        changePercent: -6.72,
        severity: "warning",
        direction: "decrease",
      },
      clickOuts: {
        current: 2471,
        baseline: 2402,
        change: 69,
        changePercent: 2.87,
        severity: "normal",
        direction: "increase",
      },
    },
    anomalies: [
      {
        metric: "cvr",
        data: {
          current: 12.8,
          baseline: 14.3,
          change: -1.5,
          changePercent: -10.49,
          severity: "critical",
          direction: "decrease",
        },
        breakdowns: [
          {
            dimension: "device",
            value: "mobile",
            changePercent: -15.2,
            isPrimaryDriver: true,
          },
          {
            dimension: "account_name",
            value: "Google Ads - Main",
            changePercent: -12.3,
            isPrimaryDriver: false,
          },
        ],
      },
    ],
    decisionTree: {
      id: "root",
      type: "metric",
      label: "ROAS Decline",
      value: "-13.83%",
      passed: true,
      children: [],
    },
    rawData: {
      current: [],
      baseline: [],
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h1 className="text-2xl font-bold text-blue-900 mb-2">
            📊 Statistical Significance Test Page
          </h1>
          <p className="text-blue-800">
            This is a test page with mock data to demonstrate the statistical
            significance analysis. Scroll down to see the full analysis with
            formulas, Z-scores, p-values, and confidence intervals.
          </p>
        </div>

        <DecisionTreeView results={mockResults} />
      </div>
    </main>
  );
}
