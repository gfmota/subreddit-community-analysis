import { useState } from "react";
import SubredditHistory from "./SubredditHistory";
import CloseButton from "./CloseButton";

export default function SubredditPanel({ graph, selectedNode, onClose }) {
  const [showConnections, setShowConnections] = useState(false);

  if (!selectedNode || !graph || !graph.hasNode(selectedNode)) return null;

  const attrs = graph.getNodeAttributes(selectedNode).rawData;
  const neighbors = graph.neighbors(selectedNode).map((n) => {
    const edgeKeys = graph.edges(selectedNode, n);
    return {
      ...graph.getNodeAttributes(n).rawData,
      edge:
        edgeKeys.length > 0
          ? graph.getEdgeAttributes(edgeKeys[0]).rawData
          : null,
    };
  });

  return (
    <div>
      <CloseButton onClick={onClose} />
      <h2 style={{ marginTop: 0 }}>r/{attrs.name}</h2>
      <p>Interactions: {attrs.interactions?.toLocaleString()}</p>
      <p>Users: {attrs.users?.toLocaleString()}</p>
      <p>Degree: {attrs.degree}</p>
      <p>Strength: {attrs.strength?.toLocaleString()}</p>

      <button
        onClick={() => setShowConnections((prev) => !prev)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "8px 0",
          background: "none",
          border: "none",
          borderTop: "1px solid #eee",
          borderBottom: showConnections ? "none" : "1px solid #eee",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Connections ({neighbors.length})</span>
        <span
          style={{
            transform: showConnections ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          ›
        </span>
      </button>

      {showConnections && (
        <div style={{ borderBottom: "1px solid #eee", paddingBottom: 8 }}>
          {neighbors
            .sort(
              (a, b) =>
                (b.edge?.shared_users || 0) - (a.edge?.shared_users || 0),
            )
            .map((n) => (
              <div
                key={n.id}
                style={{
                  borderBottom: "1px solid #f5f5f5",
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
      )}

      <SubredditHistory subredditId={selectedNode} />
    </div>
  );
}
