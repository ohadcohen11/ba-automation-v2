"use client";

import { useState } from "react";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import ResultsTable from "@/components/ResultsTable";
import DecisionTreeView from "@/components/DecisionTreeView";
import DailyKPIsTable from "@/components/DailyKPIsTable";
import RawDataTable from "@/components/RawDataTable";
import { AnomalyResult } from "@/types";
import { BarChart3, Table2, AlertCircle, GitBranch } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"kpis" | "raw" | "results" | "tree">("kpis");
  const [results, setResults] = useState<AnomalyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (config: {
    targetDate: string;
    baselineDays: number;
    advertiserIds: number[];
  }) => {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json();

      // Check if the response is an error
      if (!response.ok || data.error) {
        console.error("API Error:", data.error || "Unknown error");
        alert(`Failed to analyze data: ${data.error || "Unknown error"}`);
        return;
      }

      setResults(data);
    } catch (error) {
      console.error("Error analyzing data:", error);
      alert("Failed to analyze data. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Anomaly Detection Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Morning Routine Analysis - Dating Vertical
          </p>
        </header>

        <ConfigurationPanel onAnalyze={handleAnalyze} loading={loading} />

        {results && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-2">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setActiveTab("kpis")}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium text-sm transition-all ${
                    activeTab === "kpis"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Daily KPIs</span>
                </button>
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium text-sm transition-all ${
                    activeTab === "raw"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Table2 className="w-4 h-4" />
                  <span>Raw Data</span>
                </button>
                <button
                  onClick={() => setActiveTab("results")}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium text-sm transition-all ${
                    activeTab === "results"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Anomalies</span>
                </button>
                <button
                  onClick={() => setActiveTab("tree")}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium text-sm transition-all ${
                    activeTab === "tree"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  <span>Decision Tree</span>
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
              {activeTab === "tree" && <DecisionTreeView results={results} />}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
