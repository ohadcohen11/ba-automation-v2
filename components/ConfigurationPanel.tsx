"use client";

import { useState } from "react";
import { format } from "date-fns";

interface ConfigurationPanelProps {
  onAnalyze: (config: {
    targetDate: string;
    baselineDays: number;
    advertiserIds: number[];
  }) => void;
  loading: boolean;
}

const VERTICALS = {
  dating: {
    name: "Dating",
    ids: [76],
  },
  // Add more verticals here as needed
};

export default function ConfigurationPanel({
  onAnalyze,
  loading,
}: ConfigurationPanelProps) {
  const [targetDate, setTargetDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [baselineDays, setBaselineDays] = useState(13);
  const [selectedVertical, setSelectedVertical] = useState("dating");
  const [customIds, setCustomIds] = useState("");
  const [useCustomIds, setUseCustomIds] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const advertiserIds = useCustomIds
      ? customIds.split(",").map((id) => parseInt(id.trim()))
      : VERTICALS[selectedVertical as keyof typeof VERTICALS].ids;

    onAnalyze({
      targetDate,
      baselineDays,
      advertiserIds,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-base font-bold text-gray-900 mb-3">Configuration</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Baseline Days
            </label>
            <input
              type="number"
              value={baselineDays}
              onChange={(e) => setBaselineDays(parseInt(e.target.value))}
              min={1}
              max={30}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">
              Compare vs avg of last {baselineDays} days
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Vertical
            </label>
            <select
              value={selectedVertical}
              onChange={(e) => setSelectedVertical(e.target.value)}
              disabled={useCustomIds}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {Object.entries(VERTICALS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useCustomIds}
              onChange={(e) => setUseCustomIds(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-700">
              Use Custom Advertiser IDs
            </span>
          </label>

          {useCustomIds && (
            <input
              type="text"
              value={customIds}
              onChange={(e) => setCustomIds(e.target.value)}
              placeholder="e.g., 76, 82, 100048"
              className="w-full mt-2 px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
    </div>
  );
}
