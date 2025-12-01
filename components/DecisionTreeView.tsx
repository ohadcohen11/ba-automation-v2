"use client";

import { AnomalyResult, DecisionNode } from "@/types";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DecisionTreeViewProps {
  results: AnomalyResult;
}

function TreeNode({ node, level = 0 }: { node: DecisionNode; level?: number }) {
  const getIcon = () => {
    if (node.passed === undefined) {
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
    return node.passed ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getBgColor = () => {
    if (node.type === "metric") {
      if (node.passed === true) return "bg-red-50 border-red-200";
      if (node.passed === false) return "bg-green-50 border-green-200";
    }
    if (node.type === "condition") {
      return "bg-blue-50 border-blue-200";
    }
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div className={`ml-${level * 8}`}>
      <div
        className={`border rounded-lg p-4 mb-3 ${getBgColor()} transition-all hover:shadow-md`}
      >
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{node.label}</h4>
              {node.value !== undefined && (
                <span className="text-sm font-semibold text-gray-700 bg-white px-2 py-1 rounded">
                  {node.value}
                </span>
              )}
            </div>
            {node.passed !== undefined && (
              <p className="text-sm text-gray-600 mt-1">
                {node.passed ? "Condition met ✓" : "Condition not met ✗"}
              </p>
            )}
          </div>
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="ml-8 border-l-2 border-gray-300 pl-4">
          {node.children.map((child, index) => (
            <TreeNode key={child.id || index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DecisionTreeView({ results }: DecisionTreeViewProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Decision Tree Analysis</h2>
        <p className="text-sm text-gray-600">
          This shows the decision flow based on the anomaly detection logic.
          Green indicates normal performance, red indicates issues detected.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">Condition met (issue detected)</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-700">Condition not met (normal)</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Not evaluated</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <TreeNode node={results.decisionTree} />
        </div>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="font-medium text-gray-900 mb-4">
          Decision Tree Summary
        </h3>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p className="mb-3">
            The decision tree follows the morning routine analysis logic:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>ROAS Decline:</strong> First, we check if there's a
              decline in Return on Ad Spend (ROI)
            </li>
            <li>
              <strong>CPA Increase:</strong> If ROAS declined, we investigate
              if Cost Per Acquisition increased
            </li>
            <li>
              <strong>Root Cause:</strong> We drill down to identify if the
              issue is from:
              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                <li>CPC (Cost Per Click) increase</li>
                <li>CVR (Conversion Rate) decrease</li>
              </ul>
            </li>
            <li>
              <strong>EPA Analysis:</strong> We also check for Earnings Per
              Action changes
            </li>
            <li>
              <strong>Dimension Breakdown:</strong> For each anomaly, we
              analyze which dimensions (device, account, page, etc.) are
              driving the change
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
