"use client";

import { useEffect, useRef, useState } from "react";
import { AnomalyResult } from "@/types";
import mermaid from "mermaid";

interface DecisionTreeViewProps {
  results: AnomalyResult;
}

export default function DecisionTreeView({ results }: DecisionTreeViewProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePath, setActivePath] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Initialize mermaid only once
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
      },
    });
    setIsInitialized(true);
  }, []);

  // Determine which path was taken based on metrics and anomalies
  useEffect(() => {
    const path: string[] = ["A", "B"]; // Start with ROAS Change → CPA Change
    const { metrics, anomalies } = results;

    // Always add decision node
    path.push("D");

    // Check if CPC changed (either increase or decrease)
    const cpcChange = Math.abs(metrics.cpc.changePercent) > 5;
    const cvrChange = metrics.cvr && Math.abs(metrics.cvr.changePercent) > 5;

    if (cpcChange) {
      path.push("E", "F");

      // Check if change is from specific source (look at dimension breakdowns)
      const hasSpecificSource = anomalies.some(a =>
        a.breakdowns && a.breakdowns.length > 0 && a.breakdowns[0].isPrimaryDriver
      );

      // Add decision node I
      path.push("I");

      if (hasSpecificSource) {
        // Specific source path
        path.push("J", "L");
      } else {
        // Broad change path
        path.push("G", "K", "M", "O", "P", "Q", "S", "T");
      }
    } else if (cvrChange) {
      path.push("U", "V", "W");

      // Check SCTR path
      const sctrChange = Math.abs(metrics.sctr.changePercent) > 5;
      if (sctrChange) {
        path.push("X", "Y");

        const hasSpecificSource = anomalies.some(a =>
          a.breakdowns && a.breakdowns.length > 0 && a.breakdowns[0].isPrimaryDriver
        );

        path.push("AB");
        if (hasSpecificSource) {
          path.push("AE", "AF");
        } else {
          path.push("Z", "AG", "AH", "AJ", "AK");
        }
      }
    }

    // Check EPC Change
    const epcChange = metrics.epal && Math.abs(metrics.epal.changePercent) > 5;
    if (epcChange) {
      path.push("Start", "Significant");
      if (Math.abs(metrics.epal.changePercent) > 10) {
        path.push("PayModel", "CheckEPL", "DealChange");
      }
    }

    setActivePath(path);
  }, [results]);

  useEffect(() => {
    if (!isInitialized || !mermaidRef.current) return;

    // Test with simple diagram first
    const testSimple = false; // Set to true to test with simple diagram

    const mermaidDiagram = testSimple ? `
flowchart TB
    A["ROAS Change"] --> B["CPA Change"]
    B --> C["Test Node"]
` : `
flowchart TB
 subgraph s1["CPC Change Branch"]
        F["<b>Source: Daily stats report</b><br>Check if the change is from:<br>accounts/segments/quality/<br>page/device/campaigns"]
        E["<b>CPC Change</b><br>CPC: $${results.metrics.cpc.current.toFixed(2)}<br>Change: ${results.metrics.cpc.changePercent > 0 ? '+' : ''}${results.metrics.cpc.changePercent.toFixed(2)}%"]
        G@{ label: "<b>Source: Daily stats report</b><br><br>Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        H["check mix and adjust if needed"]
        G_NO_1["go back to CPC investigation"]
        I{"Is the change from a specific<br>source?"}
        J@{ label: "Recommendation:<br>adjust prices if needed" }
        L["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        K["Broad change diagnosis"]
        M{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        O{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        P{"<b>Source: Google</b><br><br>Check seasonality"}
        Q["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        S["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        T["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
  end
 subgraph s2["CVR Change Branch"]
        V["Diagnose CVR Change"]
        U["<b>CVR Change</b><br>CVR: ${results.metrics.cvr?.current.toFixed(2)}%<br>Change: ${results.metrics.cvr?.changePercent > 0 ? '+' : ''}${results.metrics.cvr?.changePercent.toFixed(2)}%"]
        W["<b>SCTR change</b><br>SCTR: ${results.metrics.sctr.current.toFixed(2)}%<br>Change: ${results.metrics.sctr.changePercent > 0 ? '+' : ''}${results.metrics.sctr.changePercent.toFixed(2)}%"]
        X["Check if the change is coming from:<br>accounts/ segments/ quality/<br>page/ device/ campaigns<br>(including actual VS tCPA)/ match<br>type/ ad group/ keyword"]
        Y{"<b>Source: Unicorn log</b><br><br>Check brand mix. Was<br>there a change in the lineup?"}
        Z@{ label: "Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        AA["check mix and adjust if needed"]
        Z_NO_1["go back to CPC investigation"]
        AB{"Is the change from a specific<br>source?"}
        AC["Manually evaluate if the result<br>is distorted"]
        AD["End flow here, likely not the<br>cause"]
        AE["Check clicks volume<br>(change/change)"]
        AF["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        AG["Broad change diagnosis"]
        AH{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        AJ{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        AK{"<b>Source: Google</b><br><br>Check seasonality"}
        AL["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        AN["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        AO["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
        AP["change in OCTL or OCTS"]
        AQ["Check if the change is coming from:<br>accounts/ segments/ quality/<br>page/ device/ campaigns<br>(including actual VS tCPA)/ match<br>type/ ad group/ keyword"]
        AR@{ label: "Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        AS["check mix and adjust if needed"]
        AR_NO_1["go back to CPC investigation"]
        AT{"Is the change from a specific<br>source?"}
        AU["Check clicks volume<br>(change/change)"]
        AV["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        AW["Broad change diagnosis"]
        AX{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        AZ{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        BA{"<b>Source: Google</b><br><br>Check seasonality"}
        BB["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        BD["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        BE["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
        BF["Brands"]
        BG{"<b>Source: Unicorn log</b><br><br>Check brand mix: Was<br>there a change in the lineup?"}
        BH{"<b>Source: Dash tracks report</b><br><br>Check performance per<br>brand (OCTL/OCTS change)"}
        BI["Manually evaluate if the result<br>is desired"]
        BJ["End flow here, likely not the<br>cause"]
        BK["Recommendation: Investigate<br>specific cause of conversion<br>rate change"]
        BL["Recommendation: Recheck<br>traffic, likely originating from<br>there"]
  end

    Start(["<b>EPC Change Detected</b><br>EPAL: $${results.metrics.epal.current.toFixed(2)}<br>Change: ${results.metrics.epal.changePercent > 0 ? '+' : ''}${results.metrics.epal.changePercent.toFixed(2)}%"])
    Significant{"Is the change<br>significant?"}
    EndInv([End Investigation])
    PayModel{"Are most brands<br>paying for Leads or Sales?"}

    subgraph RevenueMetrics ["Revenue Metric Investigation (Price)"]
        CheckEPL{"Did EPL Change?"}
        CheckEPS{"Did EPS Change?"}

        DealChange{"Did a brand<br>change their deal?"}

        EndDeal([Cause: Deal Change])
        LineupChange{"Did Lineups Change?"}

        EndLineup([Cause: Lineup Change<br>affected EPL/EPS])
        UnknownPrice([Investigate other<br>price factors])
    end

    subgraph ConversionMetrics ["Conversion Investigation (Volume/CR)"]
        CRLead[Check Outclick to Lead Ratio]
        CRSale[Check Outclick to Sale Ratio]

        Scope{"Where did the<br>CR change come from?"}
    end

    subgraph SpecificBrand ["Specific Brand Investigation"]
        Reporting{"Verify Reporting:<br>Is it accurate?"}

        TicketData[Open Ticket to Data Team<br>to fix scripts]
        DeepDive{"Isolate Source"}

        CheckLP[Check Landing Pages]
        CheckDev[Check Devices]

        ShareBrand[Share findings<br>with Brand]
    end

    subgraph AllBrands ["Global/System Investigation"]
        ProdChange{"Was there a<br>Product/Site Change?"}

        AnalyzeEff([Analyze the effect<br>of the change])
        AccountCheck{"Is the change on<br>ALL Accounts?<br>(Google, MSN, FB)"}

        External([Cause: External Factors<br>Not related to our actions])
        CampScope{"Is it from ALL campaigns<br>in the changed account?"}

        ContactPub[Reach out to Publisher]
        InvestCamp[Investigate Specific Campaign]
    end

    A["<b>ROAS Change</b><br>ROI: ${results.metrics.roi.current.toFixed(2)}%<br>Change: ${results.metrics.roi.changePercent > 0 ? '+' : ''}${results.metrics.roi.changePercent.toFixed(2)}%"]
    B["<b>CPA Change</b><br>CPAL: $${results.metrics.cpal.current.toFixed(2)}<br>Change: ${results.metrics.cpal.changePercent > 0 ? '+' : ''}${results.metrics.cpal.changePercent.toFixed(2)}%"]
    D{"CPC Change or CVR Change?"}

    A --> B & Start
    B --> D
    D -- CPC Change --> E
    D -- CVR Change --> U
    E --> F
    F --> G & I
    G -- yes --> H
    G -- no --> G_NO_1
    I -- Yes --> J
    J --> L
    I -- No --> K
    K --> M & O & P
    M --> Q
    O --> S
    P --> T
    U -- Only if significant --> V
    V -- SCTR --> W
    W --> X & Y
    X -- No --> Z
    Z -- yes --> AA
    Z -- no --> Z_NO_1
    X -- Yes --> AB
    Y -- Yes --> AC
    Y -- No --> AD
    AB -- Yes --> AE
    AE --> AF
    AB -- No --> AG
    AG --> AH & AJ & AK
    AH --> AL
    AJ --> AN
    AK --> AO
    V -- CTL / CTS --> AP
    AP --> AQ & BF
    AQ -- No --> AR
    AR -- yes --> AS
    AR -- no --> AR_NO_1
    AQ -- Yes --> AT
    AT -- Yes --> AU
    AU --> AV
    AT -- No --> AW
    AW --> AX & AZ & BA
    AX --> BB
    AZ --> BD
    BA --> BE
    BF --> BG & BH
    BG -- Yes --> BI
    BG -- No --> BJ
    BH -- Specific Brand --> BK
    BH -- All Brands --> BL
    s2 --> s1

    Start --> Significant
    Significant -- No --> EndInv
    Significant -- Yes --> PayModel
    PayModel -- Leads --> CheckEPL
    PayModel -- Sales --> CheckEPS
    CheckEPL -- Yes --> DealChange
    CheckEPS -- Yes --> DealChange
    DealChange -- Yes --> EndDeal
    DealChange -- No --> LineupChange
    LineupChange -- Yes --> EndLineup
    LineupChange -- No --> UnknownPrice
    CheckEPL -- No --> CRLead
    CheckEPS -- No --> CRSale
    CRLead --> Scope
    CRSale --> Scope
    Scope -- Specific Brand --> Reporting
    Reporting -- No/Internal Issue --> TicketData
    Reporting -- Yes/Matches Brand --> DeepDive
    DeepDive --> CheckLP
    DeepDive --> CheckDev
    CheckLP --> ShareBrand
    CheckDev --> ShareBrand
    Scope -- All Brands --> ProdChange
    ProdChange -- Yes --> AnalyzeEff
    ProdChange -- No --> AccountCheck
    AccountCheck -- Yes --> External
    AccountCheck -- No --> CampScope
    CampScope -- Yes --> ContactPub
    CampScope -- No --> InvestCamp

    classDef critical fill:#fee,stroke:#f66,stroke-width:3px
    classDef warning fill:#ffe,stroke:#fa0,stroke-width:3px
    classDef active fill:#e3f2fd,stroke:#2196f3,stroke-width:4px
    classDef decision fill:#f9f,stroke:#333,stroke-width:2px
    classDef process fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef endstate fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,rx:10
    classDef action fill:#f0f9ff,stroke:#0ea5e9,stroke-width:2px

    ${activePath.length > 0 ? `class ${activePath.join(",")} active` : ""}
    ${Math.abs(results.metrics.roi.changePercent) > 10 ? "\n    class A critical" : ""}
    ${Math.abs(results.metrics.cpal.changePercent) > 10 ? "\n    class B critical" : ""}
    ${Math.abs(results.metrics.cpc.changePercent) > 10 ? "\n    class E critical" : ""}
    ${results.metrics.cvr && Math.abs(results.metrics.cvr.changePercent) > 10 ? "\n    class U warning" : ""}

    class Significant,PayModel,CheckEPL,CheckEPS,DealChange,LineupChange,Scope,Reporting,ProdChange,AccountCheck,CampScope,DeepDive,D,I,M,O,P,Y,AB,AH,AJ,AK,AT,AX,AZ,BA,BG,BH decision
    class Start,CRLead,CRSale,TicketData,CheckLP,CheckDev,ShareBrand,ContactPub,InvestCamp,F,V,W,X,AP,AQ,BF process
    class EndInv,EndDeal,EndLineup,AnalyzeEff,External,UnknownPrice endstate
    class H,L,Q,S,T,AA,AF,AL,AN,AO,AS,AV,BB,BD,BE,BI,BK,BL action

    G@{ shape: rect}
    J@{ shape: rect}
    Z@{ shape: rect}
    AR@{ shape: rect}
    style F stroke:#000000
    style G_NO_1 stroke:#000000
    style L stroke:#D50000
    style Z_NO_1 stroke:#000000
    style AR_NO_1 stroke:#000000
    style s1 stroke:#000000
`;

    console.log("Rendering Mermaid diagram...");
    console.log("Active path:", activePath);

    mermaid.render("mermaid-diagram", mermaidDiagram)
      .then((result) => {
        console.log("Mermaid render successful");
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = result.svg;

          // Force SVG to be visible
          const svg = mermaidRef.current.querySelector('svg');
          if (svg) {
            svg.style.width = '100%';
            svg.style.height = 'auto';
            svg.style.maxWidth = '100%';
            console.log("SVG dimensions:", svg.getBoundingClientRect());
          }
        }
      })
      .catch((error) => {
        console.error("Mermaid render error:", error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<div style="color: red; padding: 20px;">
            <h3>Error rendering diagram</h3>
            <p>${error.message}</p>
            <p>Check console for details.</p>
          </div>`;
        }
      });
  }, [results, activePath, isInitialized]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Decision Tree Analysis</h2>
        <p className="text-gray-600">
          Complete investigation workflow with actual metric values. The highlighted path (blue) shows which branches are triggered based on your data.
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
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-500 rounded"></div>
            <span className="text-gray-700">Decision</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-sky-50 border-2 border-sky-500 rounded"></div>
            <span className="text-gray-700">Process/Action</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-700 rounded-full"></div>
            <span className="text-gray-700">End State</span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <span className="text-sm font-medium text-gray-700">Zoom:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom((prev) => Math.max(0.3, prev - 0.1))}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={zoom <= 0.3}
          >
            −
          </button>
          <span className="px-3 py-1 text-sm font-mono text-gray-700 min-w-[60px] text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => setZoom(1)}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={zoom >= 3}
          >
            +
          </button>
        </div>
        <span className="text-xs text-gray-500 ml-auto">
          Hold Ctrl/Cmd + scroll to zoom
        </span>
      </div>

      <div
        ref={containerRef}
        className="overflow-auto bg-white rounded-lg border border-gray-200 p-6"
        style={{ minHeight: "600px", maxHeight: "800px" }}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom((prev) => Math.min(Math.max(0.3, prev + delta), 3));
          }
        }}
      >
        <div
          ref={mermaidRef}
          style={{
            width: '100%',
            minHeight: '500px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.1s ease-out',
          }}
        />
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Analysis Summary</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Target Date:</strong> {results.targetDate}</p>
          <p><strong>Active Path:</strong> {activePath.join(" → ")}</p>
          <p><strong>Decisions Taken:</strong> {activePath.length} steps</p>
          <p><strong>Most Critical:</strong> {results.anomalies[0]?.metric || "None"}</p>
        </div>
      </div>
    </div>
  );
}
