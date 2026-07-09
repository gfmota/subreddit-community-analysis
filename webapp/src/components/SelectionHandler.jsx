import { useEffect } from "react";
import { useSigma, useRegisterEvents } from "@react-sigma/core";

export default function SelectionHandler({
  selectedNode,
  onSelectNode,
  sizeBoost = 1.5,
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
        return { ...data, zIndex: 2, size: data.size * sizeBoost };
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
  }, [sigma, selectedNode, sizeBoost]);

  return null;
}
