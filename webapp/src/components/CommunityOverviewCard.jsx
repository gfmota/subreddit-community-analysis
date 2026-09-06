import useIsMobile from '../hooks/useIsMobile';
import Button from './Button';
import CloseButton from './CloseButton';

const TOP_N = 8;

export default function CommunityOverviewCard({
  graph,
  communityId,
  label,
  onZoomIn,
  onClose,
}) {
  const isMobile = useIsMobile();
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!isMobile && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <h2 style={{ margin: 0 }}>{label ?? `Community ${communityId}`}</h2>
          <CloseButton onClick={onClose} />
        </div>
      )}
      <div>
        This community contains {rawData.size?.toLocaleString()} subreddits,{' '}
        {rawData.total_interactions?.toLocaleString()} interactions from{' '}
        {rawData.total_users?.toLocaleString()} users
      </div>

      <h3 style={{ marginBottom: 8 }}>Top subreddits</h3>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {topSubreddits.map((s) => (
          <div
            key={s.id}
            style={{
              borderBottom: '1px solid #f5f5f5',
              padding: '8px 0',
              fontSize: 14,
            }}
          >
            <strong>r/{s.name}</strong>
            <div style={{ color: '#666' }}>
              {s.interactions.toLocaleString()} interactions,{' '}
              {s.users.toLocaleString()} users
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'sticky',
          bottom: -16,
          backgroundColor: '#fff',
          margin: 0,
          paddingTop: 4,
        }}
      >
        <Button onClick={onZoomIn}>Zoom in →</Button>
      </div>
    </div>
  );
}
