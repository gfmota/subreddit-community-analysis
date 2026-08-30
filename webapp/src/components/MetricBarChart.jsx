import { useState } from 'react';

export default function MetricBarChart({
  label,
  history,
  allDates,
  metricKey,
  color,
  yAxisTicks = 4,
}) {
  const [hovered, setHovered] = useState(null); // { date, value }

  const values = allDates.map((d) => history[d]?.[metricKey] ?? null);
  const validValues = values.filter((v) => v !== null);
  const max = validValues.length > 0 ? Math.max(...validValues) : 1;

  const ticks = Array.from(
    { length: yAxisTicks + 1 },
    (_, i) => (max / yAxisTicks) * i,
  ).reverse();

  const formatTick = (v) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    if (v < 1 && v > 0) return v.toFixed(3);
    return Math.round(v).toLocaleString();
  };

  const formatValue = (v) => {
    if (v === null) return 'no data';
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toFixed(4);
  };

  return (
    <div style={{ marginBottom: 20, position: 'relative' }}>
      <div
        style={{
          fontSize: 12,
          color: '#666',
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
        {hovered && (
          <span style={{ float: 'right', fontWeight: 400, color: '#333' }}>
            {hovered.date}: {formatValue(hovered.value)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex' }}>
        {/* y axis */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 80,
            paddingRight: 6,
            fontSize: 10,
            color: '#999',
            textAlign: 'right',
          }}
        >
          {ticks.map((t, i) => (
            <span key={i}>{formatTick(t)}</span>
          ))}
        </div>

        {/* bars + x labels */}
        <div style={{ flex: 1, borderLeft: '1px solid #e5e7eb' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              height: 80,
              gap: 2,
              paddingLeft: 4,
            }}
          >
            {values.map((v, i) => (
              <div
                key={allDates[i]}
                onMouseEnter={() => setHovered({ date: allDates[i], value: v })}
                onMouseLeave={() => setHovered(null)}
                style={{
                  flex: 1,
                  height:
                    v !== null ? `${Math.max(2, (v / max) * 100)}%` : '2px',
                  background: v !== null ? color : '#e5e7eb',
                  borderRadius: '2px 2px 0 0',
                  cursor: 'pointer',
                  outline:
                    hovered?.date === allDates[i] ? '1px solid #333' : 'none',
                }}
              />
            ))}
          </div>
          <div
            style={{ display: 'flex', gap: 2, paddingLeft: 4, marginTop: 4 }}
          >
            {allDates.map((d) => (
              <div
                key={d}
                style={{
                  flex: 1,
                  fontSize: 10,
                  color: hovered?.date === d ? '#333' : '#999',
                  fontWeight: hovered?.date === d ? 600 : 400,
                  textAlign: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {d.slice(2)}{' '}
                {/* abbreviate "2020-01" to "20-01" to fit horizontally */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
