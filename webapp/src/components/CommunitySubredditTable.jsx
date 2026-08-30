import { useMemo, useState } from 'react';
import { useTimeseries } from '../hooks/useTimeseries';
import { formatCompactNumber } from '../utils/format';

const COLUMNS = [
  { key: 'users', label: 'Users', width: '23%' },
  { key: 'interactions', label: 'Interactions', width: '27%' },
  { key: 'community_centrality', label: 'Centrality', width: '20%' },
];

export default function CommunitySubredditTable({
  nodes,
  date,
  selectedSubreddit,
  onSelectSubreddit,
}) {
  const { data: timeseries } = useTimeseries();
  const [sortKey, setSortKey] = useState('interactions');
  const [sortDir, setSortDir] = useState('desc');

  const centralityById = useMemo(() => {
    const map = new Map();
    if (!timeseries) return map;
    for (const s of timeseries) {
      const community_centrality = s.history?.[date]?.community_centrality;
      if (community_centrality !== undefined)
        map.set(s.id, community_centrality);
    }
    return map;
  }, [timeseries, date]);

  const rows = useMemo(() => {
    const withCentrality = nodes.map((n) => ({
      ...n,
      community_centrality: centralityById.get(n.id) ?? null,
    }));
    return withCentrality.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [nodes, centralityById, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div>
      <table
        style={{
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                width: '30%',
                textAlign: 'left',
                padding: '6px 4px',
                position: 'sticky',
                top: 0,
                background: 'white',
              }}
            >
              Subreddit
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                title={`Sort by ${col.label}`}
                style={{
                  width: col.width,
                  textAlign: 'right',
                  padding: '6px 4px',
                  cursor: 'pointer',
                  position: 'sticky',
                  top: 0,
                  background: 'white',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  userSelect: 'none',
                }}
              >
                {col.label}
                {sortKey === col.key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => (
            <tr
              key={n.id}
              onClick={() => onSelectSubreddit(n.id)}
              title={n.name}
              style={{
                cursor: 'pointer',
                background:
                  selectedSubreddit === n.id ? '#eef2ff' : 'transparent',
                borderBottom: '1px solid #f5f5f5',
              }}
            >
              <td
                style={{
                  padding: '5px 4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                r/{n.name}
              </td>
              <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                {formatCompactNumber(n.users)}
              </td>
              <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                {formatCompactNumber(n.interactions)}
              </td>
              <td style={{ padding: '5px 4px', textAlign: 'right' }}>
                {n.community_centrality != null
                  ? n.community_centrality.toFixed(3)
                  : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
