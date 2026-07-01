import { useEffect } from "react";
import { useSigma, useRegisterEvents } from "@react-sigma/core";

export default function DragHandler() {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    let draggedNode = null;

    registerEvents({
      downNode: (event) => {
        draggedNode = event.node;
        sigma.getGraph().setNodeAttribute(draggedNode, "highlighted", true);
        sigma.getCamera().disable();
      },
      mousemovebody: (event) => {
        if (!draggedNode) return;
        const pos = sigma.viewportToGraph(event);
        sigma.getGraph().setNodeAttribute(draggedNode, "x", pos.x);
        sigma.getGraph().setNodeAttribute(draggedNode, "y", pos.y);
        event.preventSigmaDefault();
      },
      mouseup: () => {
        if (draggedNode) {
          sigma.getGraph().removeNodeAttribute(draggedNode, "highlighted");
          draggedNode = null;
          sigma.getCamera().enable();
        }
      },
      mousedown: () => {
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
      },
    });
  }, [sigma, registerEvents]);

  return null;
}
