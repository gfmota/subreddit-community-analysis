import Button from "./Button";
import CloseButton from "./CloseButton";

const TOP_N = 8;

export default function CommunityOverviewCard({
  graph,
  communityId,
  label,
  onZoomIn,
  onClose,
}) {
  if (
    communityId === null ||
    communityId === undefined ||
    !graph ||
    !graph.hasNode(communityId)
  ) {
    return null;
  }

  const rawData = graph.getNodeAttributes(communityId).rawData;
  const topSubreddits = [...rawData.subreddits]
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, TOP_N);

  return (
    <div>
      <CloseButton onClick={onClose} />
      <h2 style={{ marginTop: 0 }}>{label ?? `Community ${communityId}`}</h2>
      <p>Subreddits: {rawData.size?.toLocaleString()}</p>
      <p>Total interactions: {rawData.total_interactions?.toLocaleString()}</p>
      <p>Total users: {rawData.total_users?.toLocaleString()}</p>

      <h3 style={{ marginBottom: 8 }}>Top subreddits</h3>
      {topSubreddits.map((s) => (
        <div
          key={s.id}
          style={{
            borderBottom: "1px solid #f5f5f5",
            padding: "8px 0",
            fontSize: 14,
          }}
        >
          <strong>r/{s.name}</strong>
          <div style={{ color: "#666" }}>
            {s.interactions.toLocaleString()} interactions,{" "}
            {s.users.toLocaleString()} users
          </div>
        </div>
      ))}

      <Button onClick={onZoomIn}>Zoom in →</Button>
    </div>
  );
}
