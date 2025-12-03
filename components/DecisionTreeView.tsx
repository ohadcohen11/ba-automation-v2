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

    console.log("=== DECISION TREE PATH EVALUATION ===");
    console.log("Metrics:", metrics);
    console.log("Anomalies:", anomalies);

    // Always add decision node
    path.push("D");

    // Check if CPC changed using statistical significance
    const cpcChange = metrics.cpc.significance?.isSignificant ?? Math.abs(metrics.cpc.changePercent) > 5;
    const cvrChange = metrics.cvr?.significance?.isSignificant ?? (metrics.cvr && Math.abs(metrics.cvr.changePercent) > 5);

    console.log(`CPC Change: ${cpcChange} (${metrics.cpc.changePercent.toFixed(2)}%, p=${metrics.cpc.significance?.pValue.toFixed(4) ?? 'N/A'})`);
    console.log(`CVR Change: ${cvrChange} (${metrics.cvr?.changePercent.toFixed(2)}%, p=${metrics.cvr?.significance?.pValue.toFixed(4) ?? 'N/A'})`);

    if (cpcChange) {
      console.log("→ Taking CPC Change branch");
      path.push("E", "F");

      // Check if change is from specific source (look at dimension breakdowns)
      const cpcBreakdowns = anomalies.find(a => a.metric === 'cpc')?.breakdowns || [];
      const hasSpecificSource = cpcBreakdowns.length > 0 && cpcBreakdowns[0].isPrimaryDriver;

      // Add decision node I
      path.push("I");

      if (hasSpecificSource) {
        // Specific source path
        const primarySource = cpcBreakdowns[0];
        console.log(`  → Specific source detected: ${primarySource.dimension} = ${primarySource.value}`);
        path.push("J", "L");
      } else {
        // Broad change path
        console.log("  → Broad change across sources");
        path.push("K", "M", "O", "P");
      }
    } else if (cvrChange) {
      console.log("→ Taking CVR Change branch");
      path.push("U", "V");

      // Check SCTR path using statistical significance
      const sctrChange = metrics.sctr.significance?.isSignificant ?? Math.abs(metrics.sctr.changePercent) > 5;
      console.log(`  SCTR Change: ${sctrChange} (${metrics.sctr.changePercent.toFixed(2)}%, p=${metrics.sctr.significance?.pValue.toFixed(4) ?? 'N/A'})`);

      if (sctrChange) {
        console.log("  → SCTR changed significantly");
        path.push("W", "X");

        // Check brand mix (look at advertiser dimension)
        const cvrBreakdowns = anomalies.find(a => a.metric === 'cvr')?.breakdowns || [];
        const advertiserBreakdowns = cvrBreakdowns.filter(b =>
          b.dimension === 's_advertiser_name' || b.dimension === 'advertiser_name'
        );
        const hasBrandMixChange = advertiserBreakdowns.length > 0 &&
          advertiserBreakdowns.some(b => b.isStatisticallySignificant ?? Math.abs(b.changePercent) > 10);

        // Add brand mix decision node Y
        path.push("Y");

        if (hasBrandMixChange) {
          console.log("  → Brand mix changed (Unicorn log check: YES)");
          path.push("AC", "AD");
        } else {
          console.log("  → No brand mix change (Unicorn log check: NO)");
          // Check if change is from specific source
          const hasSpecificSource = cvrBreakdowns.length > 0 && cvrBreakdowns[0].isPrimaryDriver;

          // Add decision node AB
          path.push("AB");

          if (hasSpecificSource) {
            const primarySource = cvrBreakdowns[0];
            console.log(`    → Specific source: ${primarySource.dimension} = ${primarySource.value}`);
            path.push("AE", "AF");
          } else {
            console.log("    → Broad change");
            path.push("AG", "AH", "AJ", "AK");
          }
        }
      } else {
        console.log("  → SCTR stable, checking CTL/CTS path");
        // CTL/CTS path
        path.push("AP", "AQ");

        const cvrBreakdowns = anomalies.find(a => a.metric === 'cvr')?.breakdowns || [];
        const hasSpecificSource = cvrBreakdowns.length > 0 && cvrBreakdowns[0].isPrimaryDriver;

        // Add decision node AT
        path.push("AT");

        if (hasSpecificSource) {
          console.log("    → Specific source detected");
          path.push("AU", "AV");
        } else {
          console.log("    → Broad change");
          path.push("AW", "AX", "AZ", "BA");
        }

        // Also check brands path
        path.push("BF", "BG");
        const advertiserBreakdowns = cvrBreakdowns.filter(b =>
          b.dimension === 's_advertiser_name' || b.dimension === 'advertiser_name'
        );
        const hasBrandChange = advertiserBreakdowns.length > 0 &&
          advertiserBreakdowns.some(b => b.isStatisticallySignificant ?? Math.abs(b.changePercent) > 10);

        if (hasBrandChange) {
          console.log("    → Brand lineup changed");
          path.push("BI");
        } else {
          console.log("    → No brand change");
          path.push("BJ");
        }

        // Check brand performance
        path.push("BH");
        const isSpecificBrand = advertiserBreakdowns.length > 0 && advertiserBreakdowns[0].isPrimaryDriver;
        if (isSpecificBrand) {
          console.log("    → Specific brand issue");
          path.push("BK");
        } else {
          console.log("    → All brands affected");
          path.push("BL");
        }
      }
    }

    // Check EPC Change using statistical significance
    const epcChange = metrics.epal?.significance?.isSignificant ?? (metrics.epal && Math.abs(metrics.epal.changePercent) > 5);
    if (epcChange) {
      console.log(`→ EPC Change detected (p=${metrics.epal.significance?.pValue.toFixed(4) ?? 'N/A'})`);
      path.push("Start", "Significant");
      // Use statistical significance for the "significant" check as well
      const isHighlySignificant = metrics.epal.significance?.pValue ? metrics.epal.significance.pValue < 0.01 : Math.abs(metrics.epal.changePercent) > 10;
      if (isHighlySignificant) {
        console.log("  → Highly significant EPC change, checking EPL");
        path.push("PayModel", "CheckEPL", "DealChange");
      }
    }

    console.log("Final path:", path);
    console.log("===================================");
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Path Summary</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Target Date:</strong> {results.targetDate}</p>
            <p><strong>Active Path:</strong> {activePath.join(" → ")}</p>
            <p><strong>Decisions Taken:</strong> {activePath.length} steps</p>
            <p><strong>Most Critical:</strong> {results.anomalies[0]?.metric || "None"}</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">Decisions Made</h3>
          <div className="text-sm text-purple-800 space-y-2 max-h-40 overflow-y-auto">
            {results.anomalies.map((anomaly, idx) => (
              <div key={idx} className="border-l-2 border-purple-400 pl-2">
                <p className="font-semibold">{anomaly.metric.toUpperCase()}: {anomaly.data.changePercent > 0 ? '+' : ''}{anomaly.data.changePercent.toFixed(1)}%</p>
                {anomaly.breakdowns && anomaly.breakdowns.length > 0 && (
                  <p className="text-xs mt-1">
                    <span className="font-medium">Primary Driver:</span> {anomaly.breakdowns[0].dimension} = "{anomaly.breakdowns[0].value}" ({anomaly.breakdowns[0].changePercent > 0 ? '+' : ''}{anomaly.breakdowns[0].changePercent.toFixed(1)}%)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-lg p-6 shadow-lg">
        <h3 className="font-bold text-amber-900 mb-2 text-xl">📊 Statistical Significance Analysis</h3>
        <p className="text-sm text-amber-800 mb-4">
          Using Z-test for proportions with 95% confidence level (Z = 1.96).
          Tests whether changes are statistically significant or just normal variance.
        </p>

        <div className="grid grid-cols-1 gap-4 text-sm">
          {Object.entries(results.metrics).map(([key, metric]) => {
            if (typeof metric === 'object' && 'current' in metric && 'changePercent' in metric) {
              const sig = metric.significance;
              const hasSignificance = sig !== null && sig !== undefined;
              const isSignificant = hasSignificance && sig.isSignificant;

              // Define formulas for each metric
              const formulas: Record<string, string> = {
                cpc: 'Cost / Clicks',
                cpal: 'Cost / Approved Leads',
                cpoc: 'Cost / Click Outs',
                cpl: 'Cost / Leads',
                roi: '(Revenue / Cost) × 100',
                revenue: 'Total Revenue',
                ctr: '(Clicks / Impressions) × 100',
                cvr: '(Approved Leads / Clicks) × 100',
                sctr: '(Click Outs / Clicks) × 100',
                cotal: '(Approved Leads / Click Outs) × 100',
                epoc: 'Revenue / Click Outs',
                epl: 'Revenue / Leads',
                epal: 'Revenue / Approved Leads',
                octl: '(Leads / Click Outs) × 100',
                clicks: 'Total Clicks',
                impressions: 'Total Impressions',
                approvedLeads: 'Total Approved Leads',
                clickOuts: 'Total Click Outs',
              };

              const formula = formulas[key] || 'N/A';
              const isRateMetric = key.includes('roi') || key.includes('ctr') || key.includes('cvr') || key.includes('sctr') || key.includes('cotal') || key.includes('octl');

              return (
                <div key={key} className={`p-5 rounded-xl border-2 transition-all ${
                  isSignificant
                    ? 'bg-red-50 border-red-400 shadow-md'
                    : hasSignificance
                    ? 'bg-green-50 border-green-300'
                    : 'bg-white border-gray-300'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{key.toUpperCase()}</p>
                      {hasSignificance && (
                        <p className={`text-xs font-semibold mt-1 ${isSignificant ? 'text-red-700' : 'text-green-700'}`}>
                          {isSignificant ? '⚠️ STATISTICALLY SIGNIFICANT' : '✓ Normal Fluctuation'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Formula */}
                    <div className="bg-gray-50 rounded p-2 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-1">📐 Calculation Formula:</p>
                      <code className="text-xs bg-white px-2 py-1 rounded border border-gray-300 block font-mono">
                        {formula}
                      </code>
                    </div>

                    {/* Values */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 rounded p-2 border border-blue-200">
                        <p className="text-xs text-blue-600 font-semibold">Current (P₁):</p>
                        <p className="font-mono font-bold text-blue-900 text-sm">
                          {isRateMetric ? `${metric.current.toFixed(2)}%` :
                           key.includes('revenue') || key.includes('cost') || key.includes('cp') || key.includes('ep') ? `$${metric.current.toFixed(2)}` :
                           metric.current.toFixed(0)}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded p-2 border border-purple-200">
                        <p className="text-xs text-purple-600 font-semibold">Baseline (P₀):</p>
                        <p className="font-mono font-bold text-purple-900 text-sm">
                          {isRateMetric ? `${metric.baseline.toFixed(2)}%` :
                           key.includes('revenue') || key.includes('cost') || key.includes('cp') || key.includes('ep') ? `$${metric.baseline.toFixed(2)}` :
                           metric.baseline.toFixed(0)}
                        </p>
                      </div>
                      <div className={`rounded p-2 border ${metric.changePercent > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <p className="text-xs font-semibold" style={{color: metric.changePercent > 0 ? '#991b1b' : '#166534'}}>Change (Δ):</p>
                        <p className={`font-mono font-bold text-sm ${metric.changePercent > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Statistical Analysis */}
                    {hasSignificance ? (
                      <>
                        <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
                          <p className="text-xs font-bold text-indigo-900 mb-2">📈 Statistical Calculations:</p>

                          {/* Standard Error */}
                          <div className="mb-2">
                            <p className="text-xs text-indigo-700 font-semibold">Standard Error (SE):</p>
                            <code className="text-xs bg-white px-2 py-1 rounded border border-indigo-300 block font-mono mt-1">
                              SE = √[(P₀ × (1 - P₀)) / n] = {sig.standardError.toFixed(6)}
                            </code>
                            <p className="text-xs text-gray-600 mt-1">
                              Sample size (n) = {sig.sampleSize.toLocaleString()}
                            </p>
                          </div>

                          {/* Z-Score */}
                          <div className="mb-2">
                            <p className="text-xs text-indigo-700 font-semibold">Z-Score:</p>
                            <code className="text-xs bg-white px-2 py-1 rounded border border-indigo-300 block font-mono mt-1">
                              Z = (P₁ - P₀) / SE = {sig.zScore.toFixed(4)}
                            </code>
                          </div>

                          {/* P-Value */}
                          <div className="mb-2">
                            <p className="text-xs text-indigo-700 font-semibold">P-Value (two-tailed):</p>
                            <code className="text-xs bg-white px-2 py-1 rounded border border-indigo-300 block font-mono mt-1">
                              p = {sig.pValue.toFixed(6)} {sig.pValue < 0.05 ? '< 0.05 ✗' : '≥ 0.05 ✓'}
                            </code>
                            <p className="text-xs text-gray-600 mt-1">
                              Significance level α = 0.05 (95% confidence)
                            </p>
                          </div>

                          {/* Confidence Interval */}
                          <div>
                            <p className="text-xs text-indigo-700 font-semibold">95% Confidence Interval:</p>
                            <code className="text-xs bg-white px-2 py-1 rounded border border-indigo-300 block font-mono mt-1">
                              [{sig.confidenceInterval.lower.toFixed(2)}%, {sig.confidenceInterval.upper.toFixed(2)}%]
                            </code>
                            <p className="text-xs text-gray-600 mt-1">
                              Expected range: P₀ ± (1.96 × SE)
                            </p>
                          </div>
                        </div>

                        {/* Interpretation */}
                        <div className={`rounded p-3 border-2 ${isSignificant ? 'bg-red-100 border-red-400' : 'bg-green-100 border-green-400'}`}>
                          <p className="text-xs font-bold mb-1" style={{color: isSignificant ? '#991b1b' : '#166534'}}>
                            📋 Interpretation:
                          </p>
                          <p className="text-xs" style={{color: isSignificant ? '#7f1d1d' : '#14532d'}}>
                            {isSignificant
                              ? `The change is STATISTICALLY SIGNIFICANT (p=${sig.pValue.toFixed(4)} < 0.05). This is NOT just random variance - it represents a real change that requires investigation.`
                              : `The change is within normal statistical variance (p=${sig.pValue.toFixed(4)} ≥ 0.05). This is likely due to random fluctuation with the given sample size.`
                            }
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gray-100 rounded p-3 border border-gray-300">
                        <p className="text-xs text-gray-700">
                          Statistical significance testing not applicable for this metric type or insufficient sample size (n &lt; 30).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
