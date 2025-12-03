"use client";

import { useCallback, useEffect, useMemo } from "react";
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
import { AnomalyResult } from "@/types";

interface DecisionTreeFlowViewProps {
  results: AnomalyResult;
}

// Custom node styles based on type
const nodeColors = {
  start: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  metric: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  decision: { bg: "#fce7f3", border: "#ec4899", text: "#831843" },
  action: { bg: "#dcfce7", border: "#10b981", text: "#065f46" },
  investigation: { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
  active: { bg: "#bfdbfe", border: "#2563eb", text: "#1e3a8a" },
  critical: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
};

export default function DecisionTreeFlowView({ results }: DecisionTreeFlowViewProps) {
  const { metrics, anomalies } = results;

  // Determine active path based on data
  const activePath = useMemo(() => {
    const path = new Set<string>();
    path.add("start");

    // Check ROI/ROAS change
    if (metrics.roi.significance?.isSignificant) {
      path.add("roas");
      path.add("cpa");

      // Check CPC vs CVR
      const cpcSignificant = metrics.cpc.significance?.isSignificant;
      const cvrSignificant = metrics.cvr?.significance?.isSignificant;

      path.add("cpc_or_cvr");

      if (cpcSignificant) {
        path.add("cpc_change");
        path.add("cpc_investigate");

        // Check if specific source
        const cpcBreakdowns = anomalies.find((a) => a.metric === "cpc")?.breakdowns || [];
        const hasSpecificSource = cpcBreakdowns.length > 0 && cpcBreakdowns[0].isPrimaryDriver;

        path.add("cpc_source_check");
        if (hasSpecificSource) {
          path.add("cpc_specific");
          path.add("cpc_adjust_specific");
        } else {
          path.add("cpc_broad");
          path.add("cpc_check_history");
          path.add("cpc_check_competition");
          path.add("cpc_check_seasonality");
        }
      } else if (cvrSignificant) {
        path.add("cvr_change");
        path.add("cvr_diagnose");

        // Check SCTR
        const sctrSignificant = metrics.sctr.significance?.isSignificant;
        path.add("sctr_check");

        if (sctrSignificant) {
          path.add("sctr_change");
          path.add("sctr_investigate");

          // Check brand mix
          const cvrBreakdowns = anomalies.find((a) => a.metric === "cvr")?.breakdowns || [];
          const advertiserBreakdowns = cvrBreakdowns.filter(
            (b) => b.dimension === "s_advertiser_name" || b.dimension === "advertiser_name"
          );
          const hasBrandMix = advertiserBreakdowns.some((b) => b.isStatisticallySignificant);

          path.add("brand_mix_check");
          if (hasBrandMix) {
            path.add("brand_mix_changed");
            path.add("brand_mix_evaluate");
          } else {
            path.add("brand_mix_stable");
            const hasSpecificCvrSource = cvrBreakdowns.length > 0 && cvrBreakdowns[0].isPrimaryDriver;
            path.add("cvr_source_check");
            if (hasSpecificCvrSource) {
              path.add("cvr_specific");
              path.add("cvr_adjust_specific");
            } else {
              path.add("cvr_broad");
              path.add("cvr_check_history");
            }
          }
        } else {
          path.add("sctr_stable");
          path.add("octl_change");
          path.add("octl_investigate");
        }
      }
    }

    // Check EPC change
    if (metrics.epal?.significance?.isSignificant) {
      path.add("epc_change");
      path.add("epc_significant_check");

      // Highly significant (p < 0.01)
      if (metrics.epal.significance.pValue < 0.01) {
        path.add("epc_highly_significant");
        path.add("epc_pay_model");
      }
    }

    return path;
  }, [metrics, anomalies]);

  // Build nodes
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    let yPos = 0;
    const xSpacing = 300;
    const ySpacing = 120;

    // Start node
    nodes.push({
      id: "start",
      type: "input",
      data: {
        label: (
          <div className="text-center">
            <div className="font-bold text-sm">Start Analysis</div>
            <div className="text-xs mt-1">Target: {results.targetDate}</div>
          </div>
        )
      },
      position: { x: xSpacing * 2, y: yPos },
      style: {
        background: activePath.has("start") ? nodeColors.active.bg : nodeColors.start.bg,
        border: `2px solid ${activePath.has("start") ? nodeColors.active.border : nodeColors.start.border}`,
        borderRadius: "8px",
        padding: "12px",
        width: 200,
      },
    });

    yPos += ySpacing;

    // ROAS/ROI Change
    const roiSignificant = metrics.roi.significance?.isSignificant;
    nodes.push({
      id: "roas",
      data: {
        label: (
          <div className="text-center">
            <div className="font-bold text-sm">ROAS Change</div>
            <div className="text-xs mt-1">
              ROI: {metrics.roi.current.toFixed(2)}%
            </div>
            <div className="text-xs">
              {metrics.roi.changePercent > 0 ? "+" : ""}
              {metrics.roi.changePercent.toFixed(2)}%
            </div>
            {metrics.roi.significance && (
              <div className="text-[10px] mt-1">
                p={metrics.roi.significance.pValue.toFixed(4)}
              </div>
            )}
          </div>
        )
      },
      position: { x: xSpacing * 2, y: yPos },
      style: {
        background: activePath.has("roas")
          ? Math.abs(metrics.roi.changePercent) > 10
            ? nodeColors.critical.bg
            : nodeColors.active.bg
          : nodeColors.metric.bg,
        border: `2px solid ${
          activePath.has("roas")
            ? Math.abs(metrics.roi.changePercent) > 10
              ? nodeColors.critical.border
              : nodeColors.active.border
            : nodeColors.metric.border
        }`,
        borderRadius: "8px",
        padding: "12px",
        width: 180,
      },
    });

    yPos += ySpacing;

    // CPA Change
    nodes.push({
      id: "cpa",
      data: {
        label: (
          <div className="text-center">
            <div className="font-bold text-sm">CPA Change</div>
            <div className="text-xs mt-1">
              CPAL: ${metrics.cpal.current.toFixed(2)}
            </div>
            <div className="text-xs">
              {metrics.cpal.changePercent > 0 ? "+" : ""}
              {metrics.cpal.changePercent.toFixed(2)}%
            </div>
          </div>
        )
      },
      position: { x: xSpacing * 2, y: yPos },
      style: {
        background: activePath.has("cpa")
          ? Math.abs(metrics.cpal.changePercent) > 10
            ? nodeColors.critical.bg
            : nodeColors.active.bg
          : nodeColors.metric.bg,
        border: `2px solid ${
          activePath.has("cpa")
            ? Math.abs(metrics.cpal.changePercent) > 10
              ? nodeColors.critical.border
              : nodeColors.active.border
            : nodeColors.metric.border
        }`,
        borderRadius: "8px",
        padding: "12px",
        width: 180,
      },
    });

    yPos += ySpacing;

    // Decision: CPC or CVR?
    nodes.push({
      id: "cpc_or_cvr",
      data: {
        label: (
          <div className="text-center">
            <div className="font-bold text-sm">CPC or CVR Change?</div>
            <div className="text-[10px] mt-1">
              CPC: {metrics.cpc.significance?.isSignificant ? "✓ Significant" : "○ Stable"}
            </div>
            <div className="text-[10px]">
              CVR: {metrics.cvr?.significance?.isSignificant ? "✓ Significant" : "○ Stable"}
            </div>
          </div>
        )
      },
      position: { x: xSpacing * 2, y: yPos },
      style: {
        background: activePath.has("cpc_or_cvr") ? nodeColors.active.bg : nodeColors.decision.bg,
        border: `2px solid ${activePath.has("cpc_or_cvr") ? nodeColors.active.border : nodeColors.decision.border}`,
        borderRadius: "12px",
        padding: "12px",
        width: 200,
      },
    });

    yPos += ySpacing;

    // CPC Branch
    if (metrics.cpc.significance?.isSignificant) {
      nodes.push({
        id: "cpc_change",
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-sm">CPC Change</div>
              <div className="text-xs mt-1">
                ${metrics.cpc.current.toFixed(2)}
              </div>
              <div className="text-xs">
                {metrics.cpc.changePercent > 0 ? "+" : ""}
                {metrics.cpc.changePercent.toFixed(2)}%
              </div>
              <div className="text-[10px] mt-1">
                p={metrics.cpc.significance.pValue.toFixed(4)}
              </div>
            </div>
          )
        },
        position: { x: xSpacing * 0.5, y: yPos },
        style: {
          background: nodeColors.critical.bg,
          border: `2px solid ${nodeColors.critical.border}`,
          borderRadius: "8px",
          padding: "12px",
          width: 160,
        },
      });

      nodes.push({
        id: "cpc_investigate",
        data: { label: "Investigate CPC\nSources" },
        position: { x: xSpacing * 0.5, y: yPos + ySpacing },
        style: {
          background: activePath.has("cpc_investigate") ? nodeColors.active.bg : nodeColors.investigation.bg,
          border: `2px solid ${activePath.has("cpc_investigate") ? nodeColors.active.border : nodeColors.investigation.border}`,
          borderRadius: "8px",
          padding: "10px",
          width: 160,
        },
      });

      // CPC Source check
      const cpcBreakdowns = anomalies.find((a) => a.metric === "cpc")?.breakdowns || [];
      const hasSpecificSource = cpcBreakdowns.length > 0 && cpcBreakdowns[0].isPrimaryDriver;

      nodes.push({
        id: "cpc_source_check",
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-xs">Specific Source?</div>
              {cpcBreakdowns.length > 0 && (
                <div className="text-[10px] mt-1">
                  {cpcBreakdowns[0].dimension}:<br/>
                  {cpcBreakdowns[0].value}
                </div>
              )}
            </div>
          )
        },
        position: { x: xSpacing * 0.5, y: yPos + ySpacing * 2 },
        style: {
          background: activePath.has("cpc_source_check") ? nodeColors.active.bg : nodeColors.decision.bg,
          border: `2px solid ${activePath.has("cpc_source_check") ? nodeColors.active.border : nodeColors.decision.border}`,
          borderRadius: "12px",
          padding: "10px",
          width: 140,
        },
      });

      if (hasSpecificSource) {
        nodes.push({
          id: "cpc_specific",
          data: { label: `Specific: ${cpcBreakdowns[0].value}` },
          position: { x: xSpacing * 0, y: yPos + ySpacing * 3 },
          style: {
            background: nodeColors.active.bg,
            border: `2px solid ${nodeColors.active.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });

        nodes.push({
          id: "cpc_adjust_specific",
          type: "output",
          data: { label: "Adjust prices for\nspecific source" },
          position: { x: xSpacing * 0, y: yPos + ySpacing * 4 },
          style: {
            background: nodeColors.action.bg,
            border: `2px solid ${nodeColors.action.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });
      } else {
        nodes.push({
          id: "cpc_broad",
          data: { label: "Broad Change" },
          position: { x: xSpacing * 1, y: yPos + ySpacing * 3 },
          style: {
            background: activePath.has("cpc_broad") ? nodeColors.active.bg : nodeColors.investigation.bg,
            border: `2px solid ${activePath.has("cpc_broad") ? nodeColors.active.border : nodeColors.investigation.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });

        nodes.push({
          id: "cpc_check_history",
          type: "output",
          data: { label: "Check Google\nChange History" },
          position: { x: xSpacing * 0.5, y: yPos + ySpacing * 4 },
          style: {
            background: nodeColors.action.bg,
            border: `2px solid ${nodeColors.action.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });

        nodes.push({
          id: "cpc_check_competition",
          type: "output",
          data: { label: "Check Auction\nInsights" },
          position: { x: xSpacing * 1, y: yPos + ySpacing * 4 },
          style: {
            background: nodeColors.action.bg,
            border: `2px solid ${nodeColors.action.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });

        nodes.push({
          id: "cpc_check_seasonality",
          type: "output",
          data: { label: "Check\nSeasonality" },
          position: { x: xSpacing * 1.5, y: yPos + ySpacing * 4 },
          style: {
            background: nodeColors.action.bg,
            border: `2px solid ${nodeColors.action.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });
      }
    }

    // CVR Branch
    if (metrics.cvr?.significance?.isSignificant) {
      nodes.push({
        id: "cvr_change",
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-sm">CVR Change</div>
              <div className="text-xs mt-1">
                {metrics.cvr.current.toFixed(2)}%
              </div>
              <div className="text-xs">
                {metrics.cvr.changePercent > 0 ? "+" : ""}
                {metrics.cvr.changePercent.toFixed(2)}%
              </div>
              <div className="text-[10px] mt-1">
                p={metrics.cvr.significance.pValue.toFixed(4)}
              </div>
            </div>
          )
        },
        position: { x: xSpacing * 3.5, y: yPos },
        style: {
          background: nodeColors.critical.bg,
          border: `2px solid ${nodeColors.critical.border}`,
          borderRadius: "8px",
          padding: "12px",
          width: 160,
        },
      });

      nodes.push({
        id: "cvr_diagnose",
        data: { label: "Diagnose CVR\nChange" },
        position: { x: xSpacing * 3.5, y: yPos + ySpacing },
        style: {
          background: activePath.has("cvr_diagnose") ? nodeColors.active.bg : nodeColors.investigation.bg,
          border: `2px solid ${activePath.has("cvr_diagnose") ? nodeColors.active.border : nodeColors.investigation.border}`,
          borderRadius: "8px",
          padding: "10px",
          width: 160,
        },
      });

      // SCTR check
      const sctrSignificant = metrics.sctr.significance?.isSignificant;
      nodes.push({
        id: "sctr_check",
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-xs">SCTR Changed?</div>
              <div className="text-[10px] mt-1">
                {metrics.sctr.current.toFixed(2)}%
              </div>
              <div className="text-[10px]">
                {metrics.sctr.significance?.isSignificant ? "✓ Significant" : "○ Stable"}
              </div>
            </div>
          )
        },
        position: { x: xSpacing * 3.5, y: yPos + ySpacing * 2 },
        style: {
          background: activePath.has("sctr_check") ? nodeColors.active.bg : nodeColors.decision.bg,
          border: `2px solid ${activePath.has("sctr_check") ? nodeColors.active.border : nodeColors.decision.border}`,
          borderRadius: "12px",
          padding: "10px",
          width: 140,
        },
      });

      if (sctrSignificant) {
        nodes.push({
          id: "sctr_change",
          data: { label: "SCTR Changed" },
          position: { x: xSpacing * 3, y: yPos + ySpacing * 3 },
          style: {
            background: nodeColors.active.bg,
            border: `2px solid ${nodeColors.active.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });

        nodes.push({
          id: "sctr_investigate",
          type: "output",
          data: { label: "Investigate SCTR\nby dimensions" },
          position: { x: xSpacing * 3, y: yPos + ySpacing * 4 },
          style: {
            background: nodeColors.action.bg,
            border: `2px solid ${nodeColors.action.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });
      } else {
        nodes.push({
          id: "sctr_stable",
          data: { label: "SCTR Stable" },
          position: { x: xSpacing * 4, y: yPos + ySpacing * 3 },
          style: {
            background: activePath.has("sctr_stable") ? nodeColors.active.bg : nodeColors.investigation.bg,
            border: `2px solid ${activePath.has("sctr_stable") ? nodeColors.active.border : nodeColors.investigation.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });

        nodes.push({
          id: "octl_change",
          type: "output",
          data: { label: "Check OCTL/OCTS\nChange" },
          position: { x: xSpacing * 4, y: yPos + ySpacing * 4 },
          style: {
            background: nodeColors.action.bg,
            border: `2px solid ${nodeColors.action.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });
      }
    }

    // EPC Branch (separate flow)
    if (metrics.epal?.significance?.isSignificant) {
      nodes.push({
        id: "epc_change",
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-sm">EPC Change</div>
              <div className="text-xs mt-1">
                EPAL: ${metrics.epal.current.toFixed(2)}
              </div>
              <div className="text-xs">
                {metrics.epal.changePercent > 0 ? "+" : ""}
                {metrics.epal.changePercent.toFixed(2)}%
              </div>
              <div className="text-[10px] mt-1">
                p={metrics.epal.significance.pValue.toFixed(4)}
              </div>
            </div>
          )
        },
        position: { x: xSpacing * 5.5, y: 0 },
        style: {
          background: nodeColors.metric.bg,
          border: `2px solid ${nodeColors.metric.border}`,
          borderRadius: "8px",
          padding: "12px",
          width: 180,
        },
      });

      nodes.push({
        id: "epc_significant_check",
        data: { label: "Highly\nSignificant?" },
        position: { x: xSpacing * 5.5, y: ySpacing },
        style: {
          background: nodeColors.decision.bg,
          border: `2px solid ${nodeColors.decision.border}`,
          borderRadius: "12px",
          padding: "10px",
          width: 140,
        },
      });

      if (metrics.epal.significance.pValue < 0.01) {
        nodes.push({
          id: "epc_highly_significant",
          data: { label: "Yes\n(p < 0.01)" },
          position: { x: xSpacing * 5.5, y: ySpacing * 2 },
          style: {
            background: nodeColors.active.bg,
            border: `2px solid ${nodeColors.active.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });

        nodes.push({
          id: "epc_pay_model",
          type: "output",
          data: { label: "Check Pay Model\n& Deal Changes" },
          position: { x: xSpacing * 5.5, y: ySpacing * 3 },
          style: {
            background: nodeColors.action.bg,
            border: `2px solid ${nodeColors.action.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });
      } else {
        nodes.push({
          id: "epc_normal",
          type: "output",
          data: { label: "Monitor\nContinue" },
          position: { x: xSpacing * 6.5, y: ySpacing * 2 },
          style: {
            background: nodeColors.action.bg,
            border: `2px solid ${nodeColors.action.border}`,
            borderRadius: "8px",
            padding: "10px",
            width: 140,
          },
        });
      }
    }

    return nodes;
  }, [results, metrics, anomalies, activePath]);

  // Build edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    // Helper to create edge
    const addEdge = (source: string, target: string, label?: string, animated = false) => {
      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        label,
        type: "smoothstep",
        animated: animated || (activePath.has(source) && activePath.has(target)),
        style: {
          stroke: activePath.has(source) && activePath.has(target) ? "#2563eb" : "#94a3b8",
          strokeWidth: activePath.has(source) && activePath.has(target) ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: activePath.has(source) && activePath.has(target) ? "#2563eb" : "#94a3b8",
        },
      });
    };

    // Main flow
    addEdge("start", "roas");
    addEdge("roas", "cpa");
    addEdge("cpa", "cpc_or_cvr");

    // CPC branch
    if (metrics.cpc.significance?.isSignificant) {
      addEdge("cpc_or_cvr", "cpc_change", "CPC");
      addEdge("cpc_change", "cpc_investigate");
      addEdge("cpc_investigate", "cpc_source_check");

      const cpcBreakdowns = anomalies.find((a) => a.metric === "cpc")?.breakdowns || [];
      const hasSpecificSource = cpcBreakdowns.length > 0 && cpcBreakdowns[0].isPrimaryDriver;

      if (hasSpecificSource) {
        addEdge("cpc_source_check", "cpc_specific", "Yes");
        addEdge("cpc_specific", "cpc_adjust_specific");
      } else {
        addEdge("cpc_source_check", "cpc_broad", "No");
        addEdge("cpc_broad", "cpc_check_history");
        addEdge("cpc_broad", "cpc_check_competition");
        addEdge("cpc_broad", "cpc_check_seasonality");
      }
    }

    // CVR branch
    if (metrics.cvr?.significance?.isSignificant) {
      addEdge("cpc_or_cvr", "cvr_change", "CVR");
      addEdge("cvr_change", "cvr_diagnose");
      addEdge("cvr_diagnose", "sctr_check");

      const sctrSignificant = metrics.sctr.significance?.isSignificant;
      if (sctrSignificant) {
        addEdge("sctr_check", "sctr_change", "Yes");
        addEdge("sctr_change", "sctr_investigate");
      } else {
        addEdge("sctr_check", "sctr_stable", "No");
        addEdge("sctr_stable", "octl_change");
      }
    }

    // EPC branch
    if (metrics.epal?.significance?.isSignificant) {
      addEdge("start", "epc_change");
      addEdge("epc_change", "epc_significant_check");

      if (metrics.epal.significance.pValue < 0.01) {
        addEdge("epc_significant_check", "epc_highly_significant", "Yes");
        addEdge("epc_highly_significant", "epc_pay_model");
      } else {
        addEdge("epc_significant_check", "epc_normal", "No");
      }
    }

    return edges;
  }, [metrics, anomalies, activePath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Interactive Decision Tree</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Node-based flow visualization showing investigation path
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 m-4 mb-0">
        <h3 className="font-semibold text-gray-900 text-sm mb-2">Legend:</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded" style={{ background: nodeColors.active.bg, border: `2px solid ${nodeColors.active.border}` }}></div>
            <span>Active Path</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded" style={{ background: nodeColors.critical.bg, border: `2px solid ${nodeColors.critical.border}` }}></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded" style={{ background: nodeColors.metric.bg, border: `2px solid ${nodeColors.metric.border}` }}></div>
            <span>Metric</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: nodeColors.decision.bg, border: `2px solid ${nodeColors.decision.border}` }}></div>
            <span>Decision</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded" style={{ background: nodeColors.investigation.bg, border: `2px solid ${nodeColors.investigation.border}` }}></div>
            <span>Investigation</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded" style={{ background: nodeColors.action.bg, border: `2px solid ${nodeColors.action.border}` }}></div>
            <span>Action</span>
          </div>
        </div>
      </div>

      <div style={{ height: "800px" }} className="m-4">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (activePath.has(node.id)) return nodeColors.active.border;
              return nodeColors.start.border;
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <strong>Interactive Controls:</strong> Drag nodes to reorganize • Zoom with mouse wheel • Pan with click & drag • Use minimap for navigation
        </div>
      </div>
    </div>
  );
}
