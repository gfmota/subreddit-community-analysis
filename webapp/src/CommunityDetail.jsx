import { useEffect, useState, useCallback } from "react";
import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  useSigma,
} from "@react-sigma/core";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import noverlap from "graphology-layout-noverlap";
import { getColor } from "./colors";
import "@react-sigma/core/lib/style.css";
import SubredditHistory from "./SubredditHistory";
import DragHandler from "./DragHandler";

function GraphLoader({ date, communityId, onDataLoaded, onGraphReady }) {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    fetch(`/graph_data/${date}/community_${communityId}.json`)
      .then((r) => {
        if (!r.ok)
          throw new Error(
            `Failed to load community_${communityId}.json: ${r.status}`,
          );
        return r.json();
      })
      .then((data) => {
        const graph = new Graph();
        const color = getColor(communityId);

        data.nodes.forEach((node) => {
          graph.addNode(String(node.id), {
            label: node.name,
            size: Math.max(2, Math.log(node.interactions + 1)),
            x: Math.random() * 10,
            y: Math.random() * 10,
            color,
            rawData: node,
          });
        });

        data.edges.forEach((edge) => {
          const source = String(edge.source);
          const target = String(edge.target);
          if (
            graph.hasNode(source) &&
            graph.hasNode(target) &&
            !graph.hasEdge(source, target)
          ) {
            graph.addEdge(source, target, {
              size: 0.5,
              color: "#e2e8f0",
              rawData: edge,
            });
          }
        });

        forceAtlas2.assign(graph, {
          iterations: 150,
          settings: { gravity: 0.5, scalingRatio: 20, adjustSizes: true },
        });

        noverlap.assign(graph, {
          maxIterations: 500,
        });

        loadGraph(graph);
        onDataLoaded(data.nodes.length, data.edges.length);
        onGraphReady(graph);
      })
      .catch((err) => console.error(err));
  }, [communityId, loadGraph, onDataLoaded, onGraphReady, date]);

  return null;
}

function SelectionHandler({ selectedNode, onSelectNode }) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    registerEvents({
      clickNode: (event) => onSelectNode(event.node),
      clickStage: () => onSelectNode(null), // click empty space to deselect
    });
  }, [registerEvents, onSelectNode]);

  useEffect(() => {
    sigma.setSetting("nodeReducer", (node, data) => {
      const graph = sigma.getGraph();
      if (
        selectedNode &&
        node !== selectedNode &&
        !graph.areNeighbors(node, selectedNode)
      ) {
        return { ...data, color: "#e5e7eb", label: "", zIndex: 0 };
      }
      if (selectedNode && node === selectedNode) {
        return { ...data, zIndex: 2, size: data.size * 1.5 };
      }
      return data;
    });

    sigma.setSetting("edgeReducer", (edge, data) => {
      const graph = sigma.getGraph();
      if (selectedNode) {
        const [source, target] = graph.extremities(edge);
        if (source !== selectedNode && target !== selectedNode) {
          return { ...data, hidden: true };
        }
        return { ...data, color: "#94a3b8", size: 1.5 };
      }
      return data;
    });

    sigma.refresh();
  }, [sigma, selectedNode]);

  return null;
}

function SubredditPanel({ graph, selectedNode, onClose }) {
  const [showConnections, setShowConnections] = useState(false);

  if (!selectedNode || !graph || !graph.hasNode(selectedNode)) return null;

  const attrs = graph.getNodeAttributes(selectedNode).rawData;
  const neighbors = graph.neighbors(selectedNode).map((n) => {
    const edgeKeys = graph.edges(selectedNode, n);
    return {
      ...graph.getNodeAttributes(n).rawData,
      edge:
        edgeKeys.length > 0
          ? graph.getEdgeAttributes(edgeKeys[0]).rawData
          : null,
    };
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: 320,
        height: "100%",
        background: "white",
        padding: 16,
        boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
        overflowY: "auto",
        zIndex: 20,
      }}
    >
      <button onClick={onClose} style={{ float: "right" }}>
        ✕
      </button>
      <h2 style={{ marginTop: 0 }}>r/{attrs.name}</h2>
      <p>Interactions: {attrs.interactions?.toLocaleString()}</p>
      <p>Users: {attrs.users?.toLocaleString()}</p>
      <p>Degree: {attrs.degree}</p>
      <p>Strength: {attrs.strength?.toLocaleString()}</p>

      <button
        onClick={() => setShowConnections((prev) => !prev)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "8px 0",
          background: "none",
          border: "none",
          borderTop: "1px solid #eee",
          borderBottom: showConnections ? "none" : "1px solid #eee",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Connections ({neighbors.length})</span>
        <span
          style={{
            transform: showConnections ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          ›
        </span>
      </button>

      {showConnections && (
        <div style={{ borderBottom: "1px solid #eee", paddingBottom: 8 }}>
          {neighbors
            .sort(
              (a, b) =>
                (b.edge?.shared_users || 0) - (a.edge?.shared_users || 0),
            )
            .map((n) => (
              <div
                key={n.id}
                style={{
                  borderBottom: "1px solid #f5f5f5",
                  padding: "8px 0",
                  fontSize: 14,
                }}
              >
                <strong>r/{n.name}</strong>
                <div style={{ color: "#666" }}>
                  {n.edge?.shared_users?.toLocaleString()} shared users
                </div>
              </div>
            ))}
        </div>
      )}

      <SubredditHistory subredditId={selectedNode} />
    </div>
  );
}

export default function CommunityDetail({
  date,
  communityId,
  selectedSubreddit,
  setSelectedSubreddit,
  onBack,
}) {
  const [stats, setStats] = useState(null);
  const [graph, setGraph] = useState(null);

  const handleDataLoaded = useCallback((nodes, edges) => {
    setStats({ nodes, edges });
  }, []);

  const handleGraphReady = useCallback((g) => {
    setGraph(g);
  }, []);

  const handleSelectNode = useCallback(
    (nodeId) => {
      setSelectedSubreddit(nodeId);
    },
    [setSelectedSubreddit],
  );

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 10,
          padding: "6px 12px",
        }}
      >
        ← Back to communities
      </button>
      {stats && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 200,
            zIndex: 10,
            fontSize: 12,
            color: "#666",
          }}
        >
          Community {communityId}: {stats.nodes} subreddits, {stats.edges}{" "}
          connections
        </div>
      )}
      <SigmaContainer style={{ width: "100%", height: "100%" }}>
        <GraphLoader
          date={date}
          communityId={communityId}
          onDataLoaded={handleDataLoaded}
          onGraphReady={handleGraphReady}
        />
        <DragHandler />
        <SelectionHandler
          selectedNode={selectedSubreddit}
          onSelectNode={handleSelectNode}
        />
      </SigmaContainer>
      <SubredditPanel
        graph={graph}
        selectedNode={selectedSubreddit}
        onClose={() => setSelectedSubreddit(null)}
      />
    </div>
  );
}
