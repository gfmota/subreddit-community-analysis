import { useEffect } from "react";
import { useSigma, useRegisterEvents } from "@react-sigma/core";

export default function SelectionHandler({
  selectedNode,
  onSelectNode,
  sizeBoost = 1.5,
  minSize = 0,
  sizeKey,
}) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    registerEvents({
      clickNode: (event) => onSelectNode(event.node),
      clickStage: () => onSelectNode(null), // click empty space to deselect
    });
  }, [registerEvents, onSelectNode]);

  useEffect(() => {
    const isFilteredOut = (nodeData) =>
      sizeKey && minSize > 0 && sizeKey(nodeData.rawData) < minSize;

    sigma.setSetting("nodeReducer", (node, data) => {
      if (isFilteredOut(data)) {
        return { ...data, hidden: true };
      }

      const graph = sigma.getGraph();
      if (
        selectedNode &&
        node !== selectedNode &&
        !graph.areNeighbors(node, selectedNode)
      ) {
        return { ...data, color: "#e5e7eb", label: "", zIndex: 0 };
      }
      if (selectedNode && node === selectedNode) {
        return { ...data, zIndex: 2, size: data.size * sizeBoost };
      }
      return data;
    });

    sigma.setSetting("edgeReducer", (edge, data) => {
      const graph = sigma.getGraph();
      const [source, target] = graph.extremities(edge);

      if (
        isFilteredOut(graph.getNodeAttributes(source)) ||
        isFilteredOut(graph.getNodeAttributes(target))
      ) {
        return { ...data, hidden: true };
      }

      if (selectedNode) {
        if (source !== selectedNode && target !== selectedNode) {
          return { ...data, hidden: true };
        }
        return { ...data, color: "#94a3b8", size: 1.5 };
      }
      return data;
    });

    sigma.refresh();
  }, [sigma, selectedNode, sizeBoost, minSize, sizeKey]);

  return null;
}
