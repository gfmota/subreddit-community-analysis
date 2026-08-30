export default function SizeFilter({
  label,
  min = 0,
  max,
  value,
  onChange,
  scroller,
}) {
  if (min >= max) return null;
  const step = Math.max(1, Math.round((max - min) / 100));

  if (scroller) {
    return (
      <div style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
        <div
          style={{
            fontSize: 14,
            marginBottom: 6,
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          {label}: {value.toLocaleString()}+
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            fontSize: 12,
            color: '#666',
          }}
        >
          <span>{min.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 4,
        flexDirection: 'column',
      }}
    >
      <label style={{ fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #ddd',
          borderRadius: 6,
          overflow: 'hidden',
          flex: 1,
        }}
      >
        <button
          onClick={() => onChange(Math.max(min ?? -Infinity, value - step))}
          style={{
            padding: '6px 10px',
            fontSize: 16,
            border: 'none',
            background: '#f5f5f5',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!isNaN(n)) onChange(n);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            width: '100%',
            textAlign: 'center',
            fontSize: 16,
            border: 'none',
            outline: 'none',
            padding: '6px 0',
          }}
        />
        <button
          onClick={() => onChange(Math.min(max ?? Infinity, value + step))}
          style={{
            padding: '6px 10px',
            fontSize: 16,
            border: 'none',
            background: '#f5f5f5',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
