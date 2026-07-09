import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { getColor } from "../utils/colors";
import { buildGraph, applyLayout } from "../utils/graph";
import { resolveColorKey } from "../utils/trajectories";
import { useFetchJson } from "../hooks/useFetchJson";
import { useAppState } from "../state/AppStateContext";
import DragHandler from "../components/DragHandler";
import BubbleLegend from "../components/BubbleLegend";
import SelectionHandler from "../components/SelectionHandler";
import Sidebar from "../components/Sidebar";
import OverviewGuide from "../components/OverviewGuide";
import CommunityOverviewCard from "../components/CommunityOverviewCard";
import SizeFilter from "../components/SizeFilter";

const communitySizeKey = (raw) => raw.size;

function GraphLoader({ date, trajectories, onDataLoaded, onGraphReady, scaleRef }) {
  const loadGraph = useLoadGraph();
  const { data } = useFetchJson(`/graph_data/${date}/communities.json`);

  useEffect(() => {
    if (!data) return;

    const { graph, scaleFn } = buildGraph(data, {
      sizeValue: (n) => n.size,
      nodeAttrs: (node) => ({
        label: node.label.toString(),
        color: getColor(resolveColorKey(trajectories, date, node.id)),
      }),
      edgeAttrs: (edge) => ({
        size: 1,
        color: "#e2e8f0",
        weight: edge.subreddit_links || 1,
      }),
    });
    scaleRef.current = scaleFn;

    // run a quick layout so nodes aren't randomly overlapping
    applyLayout(graph, { forceAtlas2: { iterations: 100 } });

    loadGraph(graph);
    onDataLoaded(data.nodes.length, data.edges.length);
    onGraphReady(graph);
  }, [data, date, trajectories, loadGraph, onDataLoaded, onGraphReady, scaleRef]);

  return null;
}

export default function CommunityGraph() {
  const { selectedDate, selectCommunity, trajectories } = useAppState();
  const [stats, setStats] = useState(null);
  const [graph, setGraph] = useState(null);
  const [highlightedCommunity, setHighlightedCommunity] = useState(null);
  const [minSize, setMinSize] = useState(0);
  const scaleRef = useRef(null);

  const handleDataLoaded = useCallback((nodes, edges) => {
    setStats({ nodes, edges });
  }, []);

  const handleGraphReady = useCallback((g) => {
    setGraph(g);
  }, []);

  const maxSize = useMemo(() => {
    if (!graph) return 0;
    return Math.max(
      0,
      ...graph.nodes().map((id) => graph.getNodeAttributes(id).rawData.size),
    );
  }, [graph]);

  // Clamp instead of resetting via effect: keeps the threshold valid for the
  // current graph without needing to reset state when the date changes.
  const effectiveMinSize = Math.min(minSize, maxSize);

  return (
    <>
      <Sidebar
        filters={
          <SizeFilter
            label="Minimum community size"
            min={0}
            max={maxSize}
            value={effectiveMinSize}
            onChange={setMinSize}
          />
        }
      >
        {highlightedCommunity === null ? (
          <OverviewGuide stats={stats} />
        ) : (
          <CommunityOverviewCard
            graph={graph}
            communityId={highlightedCommunity}
            onZoomIn={() => selectCommunity(highlightedCommunity)}
            onClose={() => setHighlightedCommunity(null)}
          />
        )}
      </Sidebar>
      <div style={{ flex: 1, height: "100%", position: "relative" }}>
        <SigmaContainer style={{ width: "100%", height: "100%" }}>
          <DragHandler />
          <GraphLoader
            date={selectedDate}
            trajectories={trajectories}
            onDataLoaded={handleDataLoaded}
            onGraphReady={handleGraphReady}
            scaleRef={scaleRef}
          />
          <SelectionHandler
            selectedNode={highlightedCommunity}
            onSelectNode={setHighlightedCommunity}
            minSize={effectiveMinSize}
            sizeKey={communitySizeKey}
          />
        </SigmaContainer>
        {scaleRef.current && (
          <BubbleLegend
            label="Community size (subreddits count)"
            scale={scaleRef.current}
            values={[10, 100, 1000]}
          />
        )}
      </div>
    </>
  );
}
