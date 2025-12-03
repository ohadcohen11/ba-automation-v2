"use client";

import { useState } from "react";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import ResultsTable from "@/components/ResultsTable";
import DecisionTreeView from "@/components/DecisionTreeView";
import DailyKPIsTable from "@/components/DailyKPIsTable";
import RawDataTable from "@/components/RawDataTable";
import AnalysisProgress from "@/components/AnalysisProgress";
import EmailReportView from "@/components/EmailReportView";
import { AnomalyResult } from "@/types";
import { BarChart3, Table2, AlertCircle, GitBranch, Mail } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"kpis" | "raw" | "results" | "tree" | "email">("kpis");
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
              {activeTab === "email" && <EmailReportView results={results} />}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
