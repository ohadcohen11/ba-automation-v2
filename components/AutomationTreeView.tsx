"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

// Node colors based on type
const nodeColors = {
  start: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  decision: { bg: "#fce7f3", border: "#ec4899", text: "#831843" },
  action: { bg: "#dcfce7", border: "#10b981", text: "#065f46" },
  process: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  source: { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
  end: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
};

export default function AutomationTreeView() {
  // Build all nodes from the tree.md structure
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    const xSpacing = 280;
    const ySpacing = 100;

    // Helper to create node
    const createNode = (
      id: string,
      label: string | React.ReactNode,
      x: number,
      y: number,
      type: keyof typeof nodeColors = "process",
      width = 220
    ): Node => ({
      id,
      data: { label: typeof label === "string" ? <div className="text-center text-xs px-2 py-1">{label}</div> : label },
      position: { x, y },
      style: {
        background: nodeColors[type].bg,
        border: `2px solid ${nodeColors[type].border}`,
        borderRadius: type === "decision" ? "12px" : "8px",
        padding: "8px",
        width,
        fontSize: "11px",
        color: nodeColors[type].text,
      },
      ...(type === "start" ? { type: "input" } : {}),
      ...(type === "end" || type === "action" ? { type: "output" } : {}),
    });

    // Start node
    nodes.push(createNode("A", <div className="font-bold">ROAS Change</div>, xSpacing * 3, 0, "start"));

    // Check at 09:00 -> CPOC Change
    nodes.push(createNode("B", "Check at 09:00 → CPOC Change", xSpacing * 3, ySpacing * 1, "process"));

    // Decision: CPC Change or CVR Change?
    nodes.push(
      createNode(
        "D",
        <div className="font-bold text-center">CPC Change or<br/>CVR Change?</div>,
        xSpacing * 3,
        ySpacing * 2,
        "decision"
      )
    );

    // EPC Change Branch (right side)
    nodes.push(createNode("Start", <div className="font-bold">EPC Change Detected</div>, xSpacing * 6, ySpacing * 1, "start", 200));

    nodes.push(createNode("Significant", "Is the change\nsignificant?", xSpacing * 6, ySpacing * 2, "decision"));
    nodes.push(createNode("EndInv", "End Investigation", xSpacing * 7, ySpacing * 3, "end", 180));

    nodes.push(createNode("PayModel", "Are most brands\npaying for Leads or Sales?", xSpacing * 6, ySpacing * 3.5, "decision"));

    // Revenue Metrics subgraph
    nodes.push(createNode("CheckEPL", "Did EPL Change?", xSpacing * 5, ySpacing * 5, "decision"));
    nodes.push(createNode("CheckEPS", "Did EPS Change?", xSpacing * 7, ySpacing * 5, "decision"));

    nodes.push(createNode("DealChange", "Did a brand\nchange their deal?", xSpacing * 6, ySpacing * 6, "decision"));
    nodes.push(createNode("EndDeal", "Cause: Deal Change", xSpacing * 5, ySpacing * 7, "end", 180));

    nodes.push(createNode("LineupChange", "Did Lineups Change?", xSpacing * 7, ySpacing * 7, "decision"));
    nodes.push(createNode("EndLineup", "Cause: Lineup Change\naffected EPL/EPS", xSpacing * 6.5, ySpacing * 8, "end", 200));
    nodes.push(createNode("UnknownPrice", "Investigate other\nprice factors", xSpacing * 7.5, ySpacing * 8, "end", 180));

    // Conversion Metrics
    nodes.push(createNode("CRLead", "Check Outclick to Lead Ratio", xSpacing * 4.5, ySpacing * 6, "process"));
    nodes.push(createNode("CRSale", "Check Outclick to Sale Ratio", xSpacing * 8, ySpacing * 6, "process"));
    nodes.push(createNode("Scope", "Where did the\nCR change come from?", xSpacing * 6.2, ySpacing * 7, "decision"));

    // Specific Brand Investigation
    nodes.push(createNode("Reporting", "Verify Reporting:\nIs it accurate?", xSpacing * 8.5, ySpacing * 8, "decision"));
    nodes.push(createNode("TicketData", "Open Ticket to Data Team\nto fix scripts", xSpacing * 8.5, ySpacing * 9, "action"));
    nodes.push(createNode("DeepDive", "Isolate Source", xSpacing * 9.5, ySpacing * 9, "process"));
    nodes.push(createNode("CheckLP", "Check Landing Pages", xSpacing * 9, ySpacing * 10, "process", 180));
    nodes.push(createNode("CheckDev", "Check Devices", xSpacing * 10, ySpacing * 10, "process", 160));
    nodes.push(createNode("ShareBrand", "Share findings\nwith Brand", xSpacing * 9.5, ySpacing * 11, "action"));

    // Global/System Investigation
    nodes.push(createNode("ProdChange", "Was there a\nProduct/Site Change?", xSpacing * 4.5, ySpacing * 8, "decision"));
    nodes.push(createNode("AnalyzeEff", "Analyze the effect\nof the change", xSpacing * 3.5, ySpacing * 9, "end", 180));
    nodes.push(createNode("AccountCheck", "Is the change on\nALL Accounts?\n(Google, MSN, FB)", xSpacing * 5, ySpacing * 9, "decision", 200));
    nodes.push(createNode("External", "Cause: External Factors\nNot related to our actions", xSpacing * 4.5, ySpacing * 10, "end", 220));
    nodes.push(createNode("CampScope", "Is it from ALL campaigns\nin the changed account?", xSpacing * 5.5, ySpacing * 10, "decision", 220));
    nodes.push(createNode("ContactPub", "Reach out to Publisher", xSpacing * 5, ySpacing * 11, "action"));
    nodes.push(createNode("InvestCamp", "Investigate Specific Campaign", xSpacing * 6, ySpacing * 11, "action", 220));

    // CPC Change Branch (LEFT SIDE - s1)
    nodes.push(createNode("E", <div className="font-bold">CPC Change</div>, xSpacing * 0.5, ySpacing * 3, "process"));

    nodes.push(
      createNode(
        "G",
        <div>
          <strong>Source: Daily stats report</strong><br/><br/>
          Check change in click%<br/>
          (e.g. bought more 'best' than 'free',<br/>
          bought more desktop than mobile)
        </div>,
        xSpacing * 0.5,
        ySpacing * 4,
        "source",
        260
      )
    );

    nodes.push(createNode("H", "check mix and adjust if needed", xSpacing * 0, ySpacing * 5, "action"));
    nodes.push(createNode("G_NO_1", "go back to CPC investigation", xSpacing * 1, ySpacing * 5, "process"));

    nodes.push(createNode("I", "Is the change from a\nspecific source?", xSpacing * 0.5, ySpacing * 6, "decision"));

    nodes.push(
      createNode(
        "J",
        <div>Recommendation:<br/>adjust prices if needed</div>,
        xSpacing * 0,
        ySpacing * 7,
        "action"
      )
    );

    nodes.push(createNode("K", "Broad change diagnosis", xSpacing * 1, ySpacing * 7, "process"));

    nodes.push(
      createNode(
        "M",
        <div>
          <strong>Source: Google Interface</strong><br/><br/>
          Check change history activity
        </div>,
        xSpacing * 0.5,
        ySpacing * 8,
        "source"
      )
    );

    nodes.push(
      createNode(
        "O",
        <div>
          <strong>Source: Google Interface</strong><br/><br/>
          Check auction insights
        </div>,
        xSpacing * 1,
        ySpacing * 8,
        "source"
      )
    );

    nodes.push(
      createNode(
        "P",
        <div>
          <strong>Source: Google</strong><br/><br/>
          Check seasonality
        </div>,
        xSpacing * 1.5,
        ySpacing * 8,
        "source"
      )
    );

    nodes.push(
      createNode(
        "Q",
        "Recommendation: Evaluate changes,\nwere they too extreme or insufficient?",
        xSpacing * 0.5,
        ySpacing * 9,
        "action",
        260
      )
    );

    nodes.push(
      createNode(
        "S",
        "Recommendation: If competition changed,\nconsider price/budget adjustments",
        xSpacing * 1,
        ySpacing * 9,
        "action",
        280
      )
    );

    nodes.push(
      createNode(
        "T",
        "Recommendation: If holiday/event,\nimplement seasonality adjustments",
        xSpacing * 1.5,
        ySpacing * 9,
        "action",
        280
      )
    );

    // CVR Change Branch (MIDDLE-RIGHT - s2)
    nodes.push(createNode("W", <div className="font-bold">SCTR change</div>, xSpacing * 3, ySpacing * 3, "process"));

    nodes.push(
      createNode(
        "Y",
        <div>
          <strong>Source: Unicorn log</strong><br/><br/>
          Check brand mix.<br/>
          Was there a change in the lineup?
        </div>,
        xSpacing * 2.5,
        ySpacing * 4,
        "source",
        260
      )
    );

    nodes.push(
      createNode(
        "Z",
        <div>
          Check change in click%<br/>
          (e.g. bought more 'best' than 'free',<br/>
          bought more desktop than mobile)
        </div>,
        xSpacing * 3,
        ySpacing * 4,
        "source",
        260
      )
    );

    nodes.push(createNode("AA", "check mix and adjust if needed", xSpacing * 2.5, ySpacing * 5, "action"));
    nodes.push(createNode("Z_NO_1", "go back to CPC investigation", xSpacing * 3.5, ySpacing * 5, "process"));

    nodes.push(createNode("AB", "Is the change from a\nspecific source?", xSpacing * 3, ySpacing * 6, "decision"));

    nodes.push(createNode("AC", "Manually evaluate if the\nresult is distorted", xSpacing * 2, ySpacing * 5, "action"));
    nodes.push(createNode("AD", "End flow here,\nlikely not the cause", xSpacing * 2, ySpacing * 6, "end"));

    nodes.push(createNode("AE", "Check clicks volume\n(change/change)", xSpacing * 2.5, ySpacing * 7, "process"));
    nodes.push(createNode("AF", "Recommendation: Continue specific\ninvestigation and adjust prices if needed", xSpacing * 2.5, ySpacing * 8, "action", 280));

    nodes.push(createNode("AG", "Broad change diagnosis", xSpacing * 3.5, ySpacing * 7, "process"));

    nodes.push(
      createNode(
        "AH",
        <div>
          <strong>Source: Google Interface</strong><br/><br/>
          Check change history activity
        </div>,
        xSpacing * 3,
        ySpacing * 8,
        "source"
      )
    );

    nodes.push(
      createNode(
        "AJ",
        <div>
          <strong>Source: Google Interface</strong><br/><br/>
          Check auction insights
        </div>,
        xSpacing * 3.5,
        ySpacing * 8,
        "source"
      )
    );

    nodes.push(
      createNode(
        "AK",
        <div>
          <strong>Source: Google</strong><br/><br/>
          Check seasonality
        </div>,
        xSpacing * 4,
        ySpacing * 8,
        "source"
      )
    );

    nodes.push(
      createNode(
        "AL",
        "Recommendation: Evaluate changes,\nwere they too extreme or insufficient?",
        xSpacing * 3,
        ySpacing * 9,
        "action",
        260
      )
    );

    nodes.push(
      createNode(
        "AN",
        "Recommendation: If competition changed,\nconsider price/budget adjustments",
        xSpacing * 3.5,
        ySpacing * 9,
        "action",
        280
      )
    );

    nodes.push(
      createNode(
        "AO",
        "Recommendation: If holiday/event,\nimplement seasonality adjustments",
        xSpacing * 4,
        ySpacing * 9,
        "action",
        280
      )
    );

    return nodes;
  }, []);

  // Build all edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    const addEdge = (source: string, target: string, label?: string, color = "#64748b") => {
      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        label,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: color,
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
        },
        labelStyle: {
          fontSize: "10px",
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: "#fff",
        },
      });
    };

    // Main flow
    addEdge("A", "B");
    addEdge("A", "Start"); // Also connects to EPC
    addEdge("B", "D");

    // CPC/CVR decision
    addEdge("D", "E", "CPC Change");
    addEdge("D", "W", "CVR Change");

    // CPC Branch (s1)
    addEdge("E", "G");
    addEdge("E", "I");
    addEdge("G", "H", "yes");
    addEdge("G", "G_NO_1", "no");
    addEdge("I", "J", "Yes");
    addEdge("I", "K", "No");
    addEdge("K", "M");
    addEdge("K", "O");
    addEdge("K", "P");
    addEdge("M", "Q");
    addEdge("O", "S");
    addEdge("P", "T");

    // CVR Branch (s2)
    addEdge("W", "Y");
    addEdge("W", "Z");
    addEdge("W", "AB");
    addEdge("Y", "AC", "Yes");
    addEdge("Y", "AD", "No");
    addEdge("Z", "AA", "yes");
    addEdge("Z", "Z_NO_1", "no");
    addEdge("AB", "AE", "Yes");
    addEdge("AE", "AF");
    addEdge("AB", "AG", "No");
    addEdge("AG", "AH");
    addEdge("AG", "AJ");
    addEdge("AG", "AK");
    addEdge("AH", "AL");
    addEdge("AJ", "AN");
    addEdge("AK", "AO");

    // EPC Change Branch
    addEdge("Start", "Significant");
    addEdge("Significant", "EndInv", "No");
    addEdge("Significant", "PayModel", "Yes");
    addEdge("PayModel", "CheckEPL", "Leads");
    addEdge("PayModel", "CheckEPS", "Sales");
    addEdge("CheckEPL", "DealChange", "Yes");
    addEdge("CheckEPS", "DealChange", "Yes");
    addEdge("DealChange", "EndDeal", "Yes");
    addEdge("DealChange", "LineupChange", "No");
    addEdge("LineupChange", "EndLineup", "Yes");
    addEdge("LineupChange", "UnknownPrice", "No");
    addEdge("CheckEPL", "CRLead", "No");
    addEdge("CheckEPS", "CRSale", "No");
    addEdge("CRLead", "Scope");
    addEdge("CRSale", "Scope");
    addEdge("Scope", "Reporting", "Specific Brand");
    addEdge("Reporting", "TicketData", "No/Internal Issue");
    addEdge("Reporting", "DeepDive", "Yes/Matches Brand");
    addEdge("DeepDive", "CheckLP");
    addEdge("DeepDive", "CheckDev");
    addEdge("CheckLP", "ShareBrand");
    addEdge("CheckDev", "ShareBrand");
    addEdge("Scope", "ProdChange", "All Brands");
    addEdge("ProdChange", "AnalyzeEff", "Yes");
    addEdge("ProdChange", "AccountCheck", "No");
    addEdge("AccountCheck", "External", "Yes");
    addEdge("AccountCheck", "CampScope", "No");
    addEdge("CampScope", "ContactPub", "Yes");
    addEdge("CampScope", "InvestCamp", "No");

    return edges;
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Complete Automation Decision Tree
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Full ROAS investigation workflow with CPC, CVR, and EPC change branches
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 m-4 mb-0">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Legend:</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded"
              style={{
                background: nodeColors.start.bg,
                border: `2px solid ${nodeColors.start.border}`,
              }}
            ></div>
            <span>Start/Entry</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-xl"
              style={{
                background: nodeColors.decision.bg,
                border: `2px solid ${nodeColors.decision.border}`,
              }}
            ></div>
            <span>Decision</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded"
              style={{
                background: nodeColors.process.bg,
                border: `2px solid ${nodeColors.process.border}`,
              }}
            ></div>
            <span>Process</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded"
              style={{
                background: nodeColors.source.bg,
                border: `2px solid ${nodeColors.source.border}`,
              }}
            ></div>
            <span>Data Source</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded"
              style={{
                background: nodeColors.action.bg,
                border: `2px solid ${nodeColors.action.border}`,
              }}
            ></div>
            <span>Action/Recommendation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded"
              style={{
                background: nodeColors.end.bg,
                border: `2px solid ${nodeColors.end.border}`,
              }}
            ></div>
            <span>End State</span>
          </div>
        </div>
      </div>

      <div style={{ height: "calc(100vh - 250px)", minHeight: "600px" }} className="m-4">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.1}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const style = node.style as any;
              return style?.border?.split(" ")[2] || nodeColors.process.border;
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          />
        </ReactFlow>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            <strong>Interactive Controls:</strong> Drag nodes to reorganize • Zoom with mouse
            wheel or +/- buttons • Pan with click & drag
          </div>
          <div>
            <strong>Navigation:</strong> Use the minimap (bottom-right) for quick navigation • Use
            fit view button to reset
          </div>
        </div>
      </div>
    </div>
  );
}
