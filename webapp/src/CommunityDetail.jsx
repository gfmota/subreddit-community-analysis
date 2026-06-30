import { useEffect, useState, useCallback } from "react";
import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  useSigma,
} from "@react-sigma/core";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { getColor } from "./colors";
import "@react-sigma/core/lib/style.css";

function GraphLoader({ communityId, onDataLoaded, onGraphReady }) {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    fetch(`/graph_data/community_${communityId}.json`)
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
              color: "rgba(226, 232, 240, 0.6)",
              rawData: edge,
            });
          }
        });

        forceAtlas2.assign(graph, {
          iterations: 150,
          settings: { gravity: 0.5, scalingRatio: 20 },
        });

        loadGraph(graph);
        onDataLoaded(data.nodes.length, data.edges.length);
        onGraphReady(graph);
      })
      .catch((err) => console.error(err));
  }, [communityId, loadGraph, onDataLoaded, onGraphReady]);

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
  if (!selectedNode || !graph || !graph.hasNode(selectedNode)) return null;

  const attrs = graph.getNodeAttributes(selectedNode).rawData;
  const neighbors = graph.neighbors(selectedNode).map((n) => {
    const edgeKey = graph.edges(selectedNode, n);
    return {
      ...graph.getNodeAttributes(n).rawData,
      edge: graph.getEdgeAttributes(edgeKey).rawData,
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

      <h3>Connections ({neighbors.length})</h3>
      {neighbors
        .sort(
          (a, b) => (b.edge?.shared_users || 0) - (a.edge?.shared_users || 0),
        )
        .map((n) => (
          <div
            key={n.id}
            style={{
              borderBottom: "1px solid #eee",
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
  );
}

export default function CommunityDetail({
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

  const handleSelectNode = useCallback((nodeId) => {
    setSelectedSubreddit(nodeId);
  }, []);

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
          {stats.nodes} subreddits, {stats.edges} connections
        </div>
      )}
      <SigmaContainer style={{ width: "100%", height: "100%" }}>
        <GraphLoader
          communityId={communityId}
          onDataLoaded={handleDataLoaded}
          onGraphReady={handleGraphReady}
        />
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
