import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SigmaContainer, useLoadGraph, useSigma } from '@react-sigma/core';
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
import OverviewGuide from '../components/OverviewGuide';
import CommunityOverviewCard from '../components/CommunityOverviewCard';
import SizeFilter from '../components/SizeFilter';
import useIsMobile from '../hooks/useIsMobile';
import OverlayPanel from '../components/OverlayPanel';
import SearchBar from '../components/SearchBar';
import DateSelector from '../components/DateSelector';
import BottomModal from '../components/BottomModal';
import InfoButton from '../components/InfoButton';

const communitySizeKey = (raw) => raw.size;

function GraphLoader({
  date,
  trajectories,
  labels,
  onDataLoaded,
  onGraphReady,
  scaleRef,
}) {
  const loadGraph = useLoadGraph();
  const { data } = useFetchJson(`/graph_data/${date}/communities.json`);

  useEffect(() => {
    if (!data) return;

    const { graph, scaleFn } = buildGraph(data, {
      sizeValue: (n) => n.size,
      nodeAttrs: (node) => ({
        label:
          resolveLabel(trajectories, labels, date, node.id) ??
          node.label.toString(),
        color: getColor(resolveColorKey(trajectories, date, node.id)),
      }),
      edgeAttrs: (edge) => ({
        size: 1,
        color: '#e2e8f0',
        weight: edge.subreddit_links || 1,
      }),
    });
    scaleRef.current = scaleFn;

    // run a quick layout so nodes aren't randomly overlapping
    applyLayout(graph, { forceAtlas2: { iterations: 100 } });

    loadGraph(graph);
    onDataLoaded(data.nodes.length, data.edges.length);
    onGraphReady(graph);
  }, [
    data,
    date,
    trajectories,
    labels,
    loadGraph,
    onDataLoaded,
    onGraphReady,
    scaleRef,
  ]);

  return null;
}

export default function CommunityGraph() {
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { selectedDate, selectCommunity, trajectories, labels } = useAppState();
  const [stats, setStats] = useState(null);
  const [graph, setGraph] = useState(null);
  const [highlightedCommunity, setHighlightedCommunityState] = useState(null);
  const [minSize, setMinSize] = useState(0);
  const scaleRef = useRef(null);

  const setHighlightedCommunity = (community) => {
    setHighlightedCommunityState(community);
    if (community) setIsModalOpen(true);
  };

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

  const highlightedLabel =
    highlightedCommunity !== null
      ? resolveLabel(trajectories, labels, selectedDate, highlightedCommunity)
      : undefined;

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setHighlightedCommunityState(null);
  }, []);

  const content =
    highlightedCommunity === null ? (
      <OverviewGuide stats={stats} title="Subreddit Network Explorer" />
    ) : (
      <CommunityOverviewCard
        graph={graph}
        communityId={highlightedCommunity}
        label={highlightedLabel}
        onZoomIn={() => selectCommunity(highlightedCommunity)}
        onClose={handleClose}
      />
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
              label={`Min. community size (max. ${maxSize})`}
              max={maxSize}
              value={effectiveMinSize}
              onChange={setMinSize}
            />
          </OverlayPanel>
          <BottomModal
            isOpen={isModalOpen}
            onClose={handleClose}
            title={
              highlightedCommunity
                ? highlightedLabel
                : 'Subreddit Network Explorer'
            }
          >
            {content}
          </BottomModal>
        </>
      ) : (
        <Sidebar
          filters={
            <SizeFilter
              label="Minimum community size"
              max={maxSize}
              value={effectiveMinSize}
              onChange={setMinSize}
              scroller
            />
          }
        >
          {content}
        </Sidebar>
      )}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <SigmaContainer style={{ width: '100%', height: '100%' }}>
          {!isMobile && <DragHandler />}
          <GraphLoader
            date={selectedDate}
            trajectories={trajectories}
            labels={labels}
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
            label={
              <>
                Community size
                <br />
                (subreddits count)
              </>
            }
            scale={scaleRef.current}
            values={[10, 100, 1000]}
          />
        )}
      </div>
    </>
  );
}
