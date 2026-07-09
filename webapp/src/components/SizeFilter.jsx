export default function SizeFilter({ label, min, max, value, onChange }) {
  if (min >= max) return null;

  const step = Math.max(1, Math.round((max - min) / 100));

  return (
    <div style={{ padding: "12px 16px", borderTop: "1px solid #eee" }}>
      <div
        style={{
          fontSize: 14,
          marginBottom: 6,
          textAlign: "center",
          fontWeight: "bold",
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
        style={{ width: "100%" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 12,
          color: "#666",
        }}
      >
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
