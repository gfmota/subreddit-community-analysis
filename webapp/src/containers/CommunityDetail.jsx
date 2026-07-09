import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { getColor } from "../utils/colors";
import { buildGraph, applyLayout } from "../utils/graph";
import { resolveColorKey, resolveLabel } from "../utils/trajectories";
import { useFetchJson } from "../hooks/useFetchJson";
import { useAppState } from "../state/AppStateContext";
import DragHandler from "../components/DragHandler";
import BubbleLegend from "../components/BubbleLegend";
import SelectionHandler from "../components/SelectionHandler";
import Sidebar from "../components/Sidebar";
import SubredditPanel from "../components/SubredditPanel";
import CommunitySubredditTable from "../components/CommunitySubredditTable";
import Button from "../components/Button";
import SizeFilter from "../components/SizeFilter";

const subredditSizeKey = (raw) => raw.interactions;

function GraphLoader({
  date,
  communityId,
  trajectories,
  onDataLoaded,
  onGraphReady,
  scaleRef,
  setColor,
}) {
  const loadGraph = useLoadGraph();
  const { data } = useFetchJson(
    `/graph_data/${date}/community_${communityId}.json`,
  );

  useEffect(() => {
    if (!data) return;

    const color = getColor(resolveColorKey(trajectories, date, communityId));
    setColor(color);

    const { graph, scaleFn } = buildGraph(data, {
      sizeValue: (n) => n.interactions,
      nodeAttrs: (node) => ({
        label: node.name,
        color,
      }),
      edgeAttrs: (edge) => ({
        size: 0.5,
        color: "#e2e8f0",
        rawData: edge,
      }),
    });
    scaleRef.current = scaleFn;

    applyLayout(graph, {
      forceAtlas2: {
        iterations: 150,
        settings: { gravity: 0.5, scalingRatio: 20, adjustSizes: true },
      },
      noverlap: { maxIterations: 500 },
    });

    loadGraph(graph);
    onDataLoaded(data.nodes.length, data.edges.length);
    onGraphReady(graph);
  }, [
    data,
    date,
    communityId,
    trajectories,
    loadGraph,
    onDataLoaded,
    onGraphReady,
    scaleRef,
    setColor,
  ]);

  return null;
}

export default function CommunityDetail() {
  const {
    selectedDate,
    selectedCommunity,
    selectedSubreddit,
    selectSubreddit,
    trajectories,
    labels,
    goBack,
  } = useAppState();
  const [stats, setStats] = useState(null);
  const [graph, setGraph] = useState(null);
  const [color, setColor] = useState("#3b82f6");
  const [minInteractions, setMinInteractions] = useState(0);
  const scaleRef = useRef(null);

  const handleDataLoaded = useCallback((nodes, edges) => {
    setStats({ nodes, edges });
  }, []);

  const handleGraphReady = useCallback((g) => {
    setGraph(g);
  }, []);

  const subredditNodes = useMemo(() => {
    if (!graph) return [];
    return graph.nodes().map((id) => graph.getNodeAttributes(id).rawData);
  }, [graph]);

  const maxInteractions = useMemo(
    () => Math.max(0, ...subredditNodes.map((n) => n.interactions)),
    [subredditNodes],
  );

  // Clamp instead of resetting via effect: keeps the threshold valid for the
  // current community without needing to reset state when it changes.
  const effectiveMinInteractions = Math.min(minInteractions, maxInteractions);

  const filteredSubredditNodes = useMemo(
    () =>
      subredditNodes.filter((n) => n.interactions >= effectiveMinInteractions),
    [subredditNodes, effectiveMinInteractions],
  );

  const communityLabel =
    resolveLabel(trajectories, labels, selectedDate, selectedCommunity) ??
    `Community ${selectedCommunity}`;

  return (
    <>
      <Sidebar
        filters={
          <SizeFilter
            label="Minimum interactions"
            min={0}
            max={maxInteractions}
            value={effectiveMinInteractions}
            onChange={setMinInteractions}
          />
        }
      >
        {selectedSubreddit === null ? (
          <>
            <Button onClick={goBack}>← Back to communities</Button>
            {stats && (
              <p style={{ fontSize: 13, color: "#666" }}>
                {communityLabel}: {stats.nodes} subreddits, {stats.edges}{" "}
                connections
              </p>
            )}
            <CommunitySubredditTable
              nodes={filteredSubredditNodes}
              date={selectedDate}
              selectedSubreddit={selectedSubreddit}
              onSelectSubreddit={selectSubreddit}
            />
          </>
        ) : (
          <SubredditPanel
            graph={graph}
            selectedNode={selectedSubreddit}
            onClose={() => selectSubreddit(null)}
          />
        )}
      </Sidebar>

      <div style={{ flex: 1, height: "100%", position: "relative" }}>
        <SigmaContainer style={{ width: "100%", height: "100%" }}>
          <GraphLoader
            date={selectedDate}
            communityId={selectedCommunity}
            trajectories={trajectories}
            onDataLoaded={handleDataLoaded}
            onGraphReady={handleGraphReady}
            scaleRef={scaleRef}
            setColor={setColor}
          />
          <DragHandler />
          <SelectionHandler
            selectedNode={selectedSubreddit}
            onSelectNode={selectSubreddit}
            minSize={effectiveMinInteractions}
            sizeKey={subredditSizeKey}
          />
        </SigmaContainer>
        {scaleRef.current && (
          <BubbleLegend
            label="Interactions count"
            scale={scaleRef.current}
            values={[10000, 100000, 1000000]}
            color={color}
          />
        )}
      </div>
    </>
  );
}
