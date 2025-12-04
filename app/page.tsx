"use client";

import { useState } from "react";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import ResultsTable from "@/components/ResultsTable";
import DecisionTreeFlowView from "@/components/DecisionTreeFlowView";
import DailyKPIsTable from "@/components/DailyKPIsTable";
import RawDataTable from "@/components/RawDataTable";
import AnalysisProgress from "@/components/AnalysisProgress";
import EmailReportView from "@/components/EmailReportView";
import DimensionalAnalysisTable from "@/components/DimensionalAnalysisTable";
import GoogleAdsAnalysisTable from "@/components/GoogleAdsAnalysisTable";
import { AnomalyResult } from "@/types";
import { BarChart3, Table2, AlertCircle, GitBranch, Mail, Monitor, Tag, FileText, Shield, Megaphone, Building2, Globe, Target, Users, Search, ExternalLink } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "kpis" | "raw" | "results" | "tree" | "email" | "google_ads" |
    "device" | "segment" | "page" | "quality" | "campaign" |
    "account" | "publisher" | "match_type" | "ad_group" | "keyword"
  >("kpis");
  const [results, setResults] = useState<AnomalyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [progressStep, setProgressStep] = useState<string>("");

  const handleAnalyze = async (config: {
    targetDate: string;
    baselineDays: number;
    advertiserIds: number[];
  }) => {
    setLoading(true);
    setProgressStep("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);

              if (data.step === 'result') {
                // Final result received
                setResults(data.data);
              } else if (data.step === 'error') {
                console.error("API Error:", data.message);
                alert(`Failed to analyze data: ${data.message}`);
                return;
              } else {
                // Progress update
                setProgressStep(data.step);
                console.log(`Progress: ${data.message}`);
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing data:", error);
      alert("Failed to analyze data. Please check the console for details.");
    } finally {
      setLoading(false);
      setProgressStep("");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Analysis Progress Overlay */}
      <AnalysisProgress isAnalyzing={loading} currentStep={progressStep} />

      <div className="max-w-[1800px] mx-auto">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Anomaly Detection Dashboard
          </h1>
          <p className="text-gray-600 text-sm">
            Morning Routine Analysis - Dating Vertical
          </p>
        </header>

        <ConfigurationPanel onAnalyze={handleAnalyze} loading={loading} />

        {results && (
          <div className="mt-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-1.5">
              <nav className="flex space-x-1">
                <button
                  onClick={() => setActiveTab("kpis")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "kpis"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Daily KPIs</span>
                </button>
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "raw"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Raw Data</span>
                </button>
                <button
                  onClick={() => setActiveTab("results")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "results"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Anomalies</span>
                </button>
                <button
                  onClick={() => setActiveTab("tree")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "tree"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Decision Tree</span>
                </button>
                <button
                  onClick={() => setActiveTab("email")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "email"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Report</span>
                </button>
                <button
                  onClick={() => setActiveTab("google_ads")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "google_ads"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Ads</span>
                </button>
                <button
                  onClick={() => setActiveTab("device")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "device"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>By Device</span>
                </button>
                <button
                  onClick={() => setActiveTab("segment")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "segment"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>By Segment</span>
                </button>
                <button
                  onClick={() => setActiveTab("page")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "page"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>By Page</span>
                </button>
                <button
                  onClick={() => setActiveTab("quality")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "quality"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>By Quality</span>
                </button>
                <button
                  onClick={() => setActiveTab("campaign")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "campaign"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>By Campaign</span>
                </button>
                <button
                  onClick={() => setActiveTab("account")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "account"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>By Account</span>
                </button>
                <button
                  onClick={() => setActiveTab("publisher")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "publisher"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>By Publisher</span>
                </button>
                <button
                  onClick={() => setActiveTab("match_type")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "match_type"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>By Match Type</span>
                </button>
                <button
                  onClick={() => setActiveTab("ad_group")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "ad_group"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>By Ad Group</span>
                </button>
                <button
                  onClick={() => setActiveTab("keyword")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded font-medium text-xs transition-all ${
                    activeTab === "keyword"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>By Keyword</span>
                </button>
              </nav>
            </div>

            <div className="transition-all duration-300">
              {activeTab === "kpis" && (
                <DailyKPIsTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                />
              )}
              {activeTab === "raw" && (
                <RawDataTable data={results.rawData.current} />
              )}
              {activeTab === "results" && <ResultsTable results={results} />}
              {activeTab === "tree" && <DecisionTreeFlowView results={results} />}
              {activeTab === "email" && <EmailReportView results={results} />}
              {activeTab === "google_ads" && (
                <GoogleAdsAnalysisTable
                  targetDate={results.targetDate}
                  lookbackDays={7}
                />
              )}
              {activeTab === "device" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="device"
                  dimensionLabel="Device"
                />
              )}
              {activeTab === "segment" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="campaign_segment"
                  dimensionLabel="Campaign Segment"
                />
              )}
              {activeTab === "page" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="page"
                  dimensionLabel="Page"
                />
              )}
              {activeTab === "quality" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="campaign_quality"
                  dimensionLabel="Campaign Quality"
                />
              )}
              {activeTab === "campaign" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="campaign_name"
                  dimensionLabel="Campaign"
                />
              )}
              {activeTab === "account" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="account_name"
                  dimensionLabel="Account"
                />
              )}
              {activeTab === "publisher" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="publisher_name"
                  dimensionLabel="Publisher"
                />
              )}
              {activeTab === "match_type" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="match_type"
                  dimensionLabel="Match Type"
                />
              )}
              {activeTab === "ad_group" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="ad_group_name"
                  dimensionLabel="Ad Group"
                />
              )}
              {activeTab === "keyword" && (
                <DimensionalAnalysisTable
                  data={[...results.rawData.current, ...results.rawData.baseline]}
                  targetDate={results.targetDate}
                  dimension="keyword_name"
                  dimensionLabel="Keyword"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
