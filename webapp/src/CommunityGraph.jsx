import { useCallback, useEffect, useState } from "react";
import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
} from "@react-sigma/core";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import "@react-sigma/core/lib/style.css";
import { getColor } from "./colors";
import DragHandler from "./DragHandler";

function GraphLoader({ date, onDataLoaded, onSelectCommunity }) {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    fetch(`/graph_data/${date}/communities.json`)
      .then((r) => {
        if (!r.ok)
          throw new Error(`Failed to load communities.json: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const graph = new Graph();

        data.nodes.forEach((node) => {
          graph.addNode(String(node.id), {
            label: node.label.toString(),
            size: Math.max(3, Math.sqrt(node.size)),
            x: Math.random() * 10,
            y: Math.random() * 10,
            color: getColor(node.id),
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
              size: 1,
              color: "#e2e8f0",
              weight: edge.subreddit_links || 1,
            });
          }
        });

        // run a quick layout so nodes aren't randomly overlapping
        forceAtlas2.assign(graph, {
          iterations: 100,
        });

        loadGraph(graph);
        onDataLoaded(data.nodes.length, data.edges.length);
      })
      .catch((err) => console.error(err));
  }, [loadGraph, onDataLoaded, date]);

  useEffect(() => {
    registerEvents({
      clickNode: (event) => onSelectCommunity(event.node),
    });
  }, [registerEvents, onSelectCommunity]);

  return null;
}

export default function CommunityGraph({ date, onSelectCommunity }) {
  const [stats, setStats] = useState(null);

  const handleDataLoaded = useCallback((nodes, edges) => {
    setStats({ nodes, edges });
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {stats && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 10,
            fontSize: 12,
            color: "#666",
          }}
        >
          {stats.nodes} communities, {stats.edges} inter-community links
        </div>
      )}
      <SigmaContainer style={{ width: "100%", height: "100%" }}>
        <DragHandler />
        <GraphLoader
          date={date}
          onDataLoaded={handleDataLoaded}
          onSelectCommunity={onSelectCommunity}
        />
      </SigmaContainer>
    </div>
  );
}
