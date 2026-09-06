import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { SigmaContainer, useLoadGraph } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { getColor } from '../utils/colors';
import { buildGraph, applyLayout } from '../utils/graph';
import { resolveColorKey, resolveLabel } from '../utils/trajectories';
import { useFetchJson } from '../hooks/useFetchJson';
import { useAppState } from '../state/AppStateContext';
import DragHandler from '../components/DragHandler';
import BubbleLegend from '../components/BubbleLegend';
import SelectionHandler from '../components/SelectionHandler';
import Sidebar from '../components/Sidebar';
import SubredditPanel from '../components/SubredditPanel';
import CommunitySubredditTable from '../components/CommunitySubredditTable';
import Button from '../components/Button';
import SizeFilter from '../components/SizeFilter';
import useIsMobile from '../hooks/useIsMobile';
import OverlayPanel from '../components/OverlayPanel';
import SearchBar from '../components/SearchBar';
import DateSelector from '../components/DateSelector';
import BottomModal from '../components/BottomModal';
import InfoButton from '../components/InfoButton';

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
        color: '#e2e8f0',
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
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(true);

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
  const [color, setColor] = useState('#3b82f6');
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

  const handleClose = () => {
    setIsModalOpen(false);
    selectSubreddit(null);
  };

  const subredditName =
    graph &&
    selectedSubreddit &&
    graph.getNodeAttributes(selectedSubreddit).rawData.name;

  const content = selectedSubreddit ? (
    <SubredditPanel
      graph={graph}
      selectedNode={selectedSubreddit}
      onClose={handleClose}
    />
  ) : (
    <>
      <Button onClick={goBack}>← Back to communities</Button>
      {stats && (
        <p style={{ fontSize: 13, color: '#666' }}>
          {communityLabel}: {stats.nodes} subreddits, {stats.edges} connections
        </p>
      )}
      <CommunitySubredditTable
        nodes={filteredSubredditNodes}
        date={selectedDate}
        selectedSubreddit={selectedSubreddit}
        onSelectSubreddit={selectSubreddit}
      />
    </>
  );

  return (
    <>
      {isMobile ? (
        <>
          <OverlayPanel style={{ width: '100%' }}>
            <SearchBar />
          </OverlayPanel>
          <OverlayPanel bottom={96} left={16}>
            <InfoButton onClick={() => setIsModalOpen(true)} />
          </OverlayPanel>
          <OverlayPanel
            left="50%"
            bottom={8}
            withBackground
            style={{
              width: 'calc(100% - 32px)',
              transform: 'translateX(-50%)',
              display: 'flex',
              padding: 8,
              gap: 8,
            }}
          >
            <DateSelector />
            <SizeFilter
              label={`Min. interactions (max. ${maxInteractions})`}
              max={maxInteractions}
              value={effectiveMinInteractions}
              onChange={setMinInteractions}
            />
          </OverlayPanel>
          <BottomModal
            isOpen={isModalOpen}
            onClose={handleClose}
            title={selectedSubreddit ? `r/${subredditName}` : communityLabel}
          >
            {content}
          </BottomModal>
        </>
      ) : (
        <Sidebar
          filters={
            <SizeFilter
              label="Minimum interactions"
              max={maxInteractions}
              value={effectiveMinInteractions}
              onChange={setMinInteractions}
              scroller
            />
          }
        >
          {content}
        </Sidebar>
      )}

      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <SigmaContainer style={{ width: '100%', height: '100%' }}>
          <GraphLoader
            date={selectedDate}
            communityId={selectedCommunity}
            trajectories={trajectories}
            onDataLoaded={handleDataLoaded}
            onGraphReady={handleGraphReady}
            scaleRef={scaleRef}
            setColor={setColor}
          />
          {!isMobile && <DragHandler />}
          <SelectionHandler
            selectedNode={selectedSubreddit}
            onSelectNode={(node) => {
              selectSubreddit(node);
              if (node) setIsModalOpen(true);
            }}
            minSize={effectiveMinInteractions}
            sizeKey={subredditSizeKey}
          />
        </SigmaContainer>
        {scaleRef.current && (
          <BubbleLegend
            label={
              <>
                Subreddit size
                <br />
                (interactions count)
              </>
            }
            scale={scaleRef.current}
            values={[10000, 100000, 1000000]}
            color={color}
          />
        )}
      </div>
    </>
  );
}
