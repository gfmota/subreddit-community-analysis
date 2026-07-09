import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import noverlap from "graphology-layout-noverlap";
import { createSizeScale } from "./scale";

// Builds a graphology Graph from { nodes, edges } data, deduping edges and
// sizing nodes off a shared scale. `nodeAttrs`/`edgeAttrs` let callers supply
// the shape-specific bits (label, color, rawData, ...).
export function buildGraph(data, { sizeValue, nodeAttrs, edgeAttrs }) {
  const graph = new Graph();
  const scaleFn = createSizeScale(data.nodes.map(sizeValue));

  data.nodes.forEach((node) => {
    graph.addNode(String(node.id), {
      size: scaleFn(sizeValue(node)),
      x: Math.random() * 10,
      y: Math.random() * 10,
      rawData: node,
      ...nodeAttrs(node),
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
      graph.addEdge(source, target, edgeAttrs(edge));
    }
  });

  return { graph, scaleFn };
}

export function applyLayout(
  graph,
  { forceAtlas2: forceAtlas2Options, noverlap: noverlapOptions } = {},
) {
  forceAtlas2.assign(graph, forceAtlas2Options);
  if (noverlapOptions) {
    noverlap.assign(graph, noverlapOptions);
  }
}
