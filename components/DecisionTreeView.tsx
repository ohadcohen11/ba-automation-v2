"use client";

import { useEffect, useRef, useState } from "react";
import { AnomalyResult } from "@/types";
import mermaid from "mermaid";

interface DecisionTreeViewProps {
  results: AnomalyResult;
}

export default function DecisionTreeView({ results }: DecisionTreeViewProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [activePath, setActivePath] = useState<string[]>([]);

  // Determine which path was taken based on metrics
  useEffect(() => {
    const path: string[] = ["A"]; // Start with ROAS Decline
    const { metrics } = results;

    // Check if ROAS declined (ROI is critical/warning)
    const roasDecline = metrics.roi.severity === "critical" || metrics.roi.severity === "warning";

    if (roasDecline) {
      // Check CPA increase
      const cpaIncrease = metrics.cpal.severity === "critical" || metrics.cpal.severity === "warning";

      if (cpaIncrease) {
        path.push("B", "D");

        // Check if CPC Increase or CVR Decrease
        const cpcIncrease = metrics.cpc.severity === "critical" || metrics.cpc.severity === "warning";
        const cvrDecrease = metrics.cvr && (metrics.cvr.severity === "critical" || metrics.cvr.severity === "warning");

        if (cpcIncrease) {
          path.push("E");
          // CPC Increase branch logic
          // Add nodes based on the actual analysis needed
        } else if (cvrDecrease) {
          path.push("U");
          // CVR Decrease branch logic
        }
      }

      // Check EPC Change
      const epcChange = metrics.epal && (metrics.epal.severity === "critical" || metrics.epal.severity === "warning");
      if (epcChange) {
        path.push("C");
      }
    }

    setActivePath(path);
  }, [results]);

  useEffect(() => {
    if (mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
        },
      });

      // Determine which branches to show based on metrics
      const cpcIncrease = results.metrics.cpc.severity === "critical" || results.metrics.cpc.severity === "warning";
      const cvrDecrease = results.metrics.cvr?.severity === "critical" || results.metrics.cvr?.severity === "warning";

      // Generate comprehensive diagram with actual values
      const mermaidDiagram = `
flowchart TB
    A["<b>ROAS Decline</b><br/>ROI: ${results.metrics.roi.current.toFixed(2)}%<br/>Change: ${results.metrics.roi.changePercent.toFixed(2)}%"]
    B["<b>CPA Increase</b><br/>CPAL: $${results.metrics.cpal.current.toFixed(2)}<br/>Change: ${results.metrics.cpal.changePercent > 0 ? '+' : ''}${results.metrics.cpal.changePercent.toFixed(2)}%"]
    C["<b>EPC Change</b><br/>EPAL: $${results.metrics.epal.current.toFixed(2)}<br/>Change: ${results.metrics.epal.changePercent > 0 ? '+' : ''}${results.metrics.epal.changePercent.toFixed(2)}%"]
    D{"CPC Increase or<br/>CVR Decrease?"}

    A --> B
    A --> C
    B --> D

    ${cpcIncrease ? `
    E["<b>CPC Increase</b><br/>CPC: $${results.metrics.cpc.current.toFixed(2)}<br/>Change: ${results.metrics.cpc.changePercent > 0 ? '+' : ''}${results.metrics.cpc.changePercent.toFixed(2)}%"]
    F["<b>Source: Daily stats report</b><br/>Check if increase is from:<br/>accounts/segments/quality/<br/>page/device/campaigns"]
    G["Check change in click%<br/>e.g. bought more 'best' than 'free'<br/>bought more desktop than mobile"]
    H["Recommendation: Examine<br/>and correct purchase mix"]
    I{"Is the increase from<br/>a specific source?"}
    J["Check clicks volume<br/>increase/decrease"]
    K["Broad increase diagnosis"]
    L["Recommendation: Continue<br/>specific investigation"]
    M{"Source: Google Interface<br/>Check change history"}
    N{"Clicks increased/<br/>decreased/<br/>remained same?"}
    O{"Source: Google Interface<br/>Check auction insights"}
    P{"Source: Google<br/>Check seasonality"}
    Q["Recommendation: Evaluate<br/>changes effectiveness"]
    R["Recommendation: Continue<br/>specific investigation"]
    S["Recommendation: Adjust<br/>for competition changes"]
    T["Recommendation: Implement<br/>seasonality adjustments"]

    D -->|CPC Increase| E
    E --> F
    F -->|No| G
    G --> H
    F -->|Yes| I
    I -->|Yes| J
    J --> L
    I -->|No| K
    K --> M
    K --> N
    K --> O
    K --> P
    M --> Q
    N --> R
    O --> S
    P --> T
    ` : ''}

    ${cvrDecrease ? `
    U["<b>CVR Decrease</b><br/>CVR: ${results.metrics.cvr?.current.toFixed(2)}%<br/>Change: ${results.metrics.cvr?.changePercent > 0 ? '+' : ''}${results.metrics.cvr?.changePercent.toFixed(2)}%"]
    V["Diagnose CVR Decrease<br/>CTL, CTS"]
    W["SCTR decrease<br/>SCTR: ${results.metrics.sctr.current.toFixed(2)}%<br/>Change: ${results.metrics.sctr.changePercent > 0 ? '+' : ''}${results.metrics.sctr.changePercent.toFixed(2)}%"]
    X["Check source:<br/>accounts/segments/quality/<br/>page/device/campaigns"]
    Y{"Source: Unicorn log<br/>Check brand mix"}
    Z["Check change in click%"]
    AA["Recommendation: Examine<br/>purchase mix"]
    AB{"Is decrease from<br/>specific source?"}
    AC["Manually evaluate<br/>if result is distorted"]
    AD["End flow here,<br/>likely not the cause"]
    AE["Check clicks volume"]
    AF["Recommendation: Continue<br/>investigation"]
    AG["Broad decrease diagnosis"]
    AH{"Source: Google Interface<br/>Check change history"}
    AI{"Clicks increased/<br/>decreased/<br/>remained same?"}
    AJ{"Source: Google Interface<br/>Check auction insights"}
    AK{"Source: Google<br/>Check seasonality"}
    AL["Recommendation: Evaluate<br/>changes effectiveness"]
    AM["Recommendation: Continue<br/>investigation"]
    AN["Recommendation: Adjust<br/>for competition"]
    AO["Recommendation: Implement<br/>seasonality adjustments"]

    D -->|CVR Decrease| U
    U --> V
    V -->|SCTR| W
    W --> X
    W --> Y
    X -->|No| Z
    Z --> AA
    X -->|Yes| AB
    Y -->|Yes| AC
    Y -->|No| AD
    AB -->|Yes| AE
    AE --> AF
    AB -->|No| AG
    AG --> AH
    AG --> AI
    AG --> AJ
    AG --> AK
    AH --> AL
    AI --> AM
    AJ --> AN
    AK --> AO
    ` : ''}

    classDef critical fill:#fee,stroke:#f66,stroke-width:3px
    classDef warning fill:#ffe,stroke:#fa0,stroke-width:3px
    classDef positive fill:#efe,stroke:#6f6,stroke-width:2px
    classDef active fill:#e3f2fd,stroke:#2196f3,stroke-width:4px
    classDef action fill:#f0f9ff,stroke:#0ea5e9,stroke-width:2px
    classDef decision fill:#fef3c7,stroke:#f59e0b,stroke-width:2px

    class ${activePath.join(",")} active
    ${results.metrics.roi.severity === "critical" ? "class A critical" : ""}
    ${results.metrics.cpal.severity === "critical" ? "class B critical" : ""}
    ${results.metrics.cpal.severity === "warning" ? "class B warning" : ""}
    ${cpcIncrease ? "class E critical" : ""}
    ${cvrDecrease ? "class U warning" : ""}
    class H,L,Q,R,S,T,AA,AF,AL,AM,AN,AO action
    class D,I,M,N,O,P,Y,AB,AH,AI,AJ,AK decision
`;

      mermaid.render("mermaid-diagram", mermaidDiagram).then((result) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = result.svg;
        }
      });
    }
  }, [results, activePath]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Decision Tree Analysis</h2>
        <p className="text-gray-600">
          This shows the decision flow based on your actual metrics. The highlighted path (blue) shows which branches were triggered.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Legend:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-700">Active Path</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
            <span className="text-gray-700">Critical</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-orange-500 rounded"></div>
            <span className="text-gray-700">Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
            <span className="text-gray-700">Positive</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-sky-50 border-2 border-sky-500 rounded"></div>
            <span className="text-gray-700">Action</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-50 border-2 border-amber-500 rounded"></div>
            <span className="text-gray-700">Decision</span>
          </div>
        </div>
      </div>

      <div
        ref={mermaidRef}
        className="overflow-x-auto bg-white rounded-lg border border-gray-200 p-6"
        style={{ minHeight: "400px" }}
      />

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Analysis Summary</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Target Date:</strong> {results.targetDate}</p>
          <p><strong>Anomalies Detected:</strong> {results.anomalies.length}</p>
          <p><strong>Most Critical:</strong> {results.anomalies[0]?.metric || "None"}</p>
        </div>
      </div>
    </div>
  );
}
