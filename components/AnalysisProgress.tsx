"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  currentStep: string; // Real step from API
}

interface Step {
  id: string;
  label: string;
}

const ANALYSIS_STEPS: Step[] = [
  { id: "connect", label: "Connecting to Trino database..." },
  { id: "query", label: "Fetching data from fact_publishers and fact_tracks..." },
  { id: "aggregate", label: "Aggregating data and calculating baseline..." },
  { id: "metrics", label: "Calculating all metrics (CPC, CVR, ROI, etc.)..." },
  { id: "stats", label: "Performing statistical significance tests..." },
  { id: "breakdowns", label: "Analyzing dimension breakdowns..." },
  { id: "tree", label: "Generating decision tree path..." },
  { id: "complete", label: "Analysis complete!" },
];

export default function AnalysisProgress({ isAnalyzing, currentStep }: AnalysisProgressProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    if (!isAnalyzing) {
      setCompletedSteps([]);
      return;
    }
  }, [isAnalyzing]);

  useEffect(() => {
    if (!currentStep) return;

    // When a new step starts, mark all previous steps as completed
    const currentIndex = ANALYSIS_STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex >= 0) {
      const completed = ANALYSIS_STEPS.slice(0, currentIndex).map(s => s.id);
      setCompletedSteps(completed);
    }
  }, [currentStep]);

  if (!isAnalyzing) {
    return null;
  }

  const currentStepIndex = ANALYSIS_STEPS.findIndex(s => s.id === currentStep);
  const progress = currentStepIndex >= 0
    ? ((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4 border-2 border-blue-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            Analyzing Data...
          </h2>
          <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {ANALYSIS_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isPending = index > currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isCurrent
                    ? "bg-blue-50 border-2 border-blue-400 scale-105"
                    : isCompleted
                    ? "bg-green-50 border border-green-300"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-green-500"
                      : isCurrent
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`flex-1 font-medium ${
                    isCompleted
                      ? "text-green-700"
                      : isCurrent
                      ? "text-blue-900"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>

                {/* Status Badge */}
                {isCompleted && (
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                    ✓ Done
                  </span>
                )}
                {isCurrent && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded animate-pulse">
                    Processing...
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <p>
            Analysis typically takes 5-10 seconds. Large date ranges or multiple
            advertisers may take longer.
          </p>
        </div>
      </div>
    </div>
  );
}
