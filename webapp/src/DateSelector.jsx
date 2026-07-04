import { useEffect, useState } from "react";

export default function DateSelector({ selectedDate, onSelectDate }) {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/graph_data/manifest.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load manifest.json: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDates(data.dates);
        setLoading(false);

        // Default to the most recent date
        if (!selectedDate && data.dates.length > 0) {
          onSelectDate(data.dates[data.dates.length - 1]);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          zIndex: 30,
          fontSize: 12,
          color: "#666",
        }}
      >
        Loading dates...
      </div>
    );
  }

  if (dates.length === 0) return null;

  const selectedIndex = Math.max(
    0,
    dates.findIndex((d) => d === selectedDate),
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        left: 8,
        zIndex: 30,
        background: "white",
        padding: "10px",
        borderRadius: 6,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        minWidth: "300px",
      }}
    >
      <div
        style={{
          fontSize: 14,
          marginBottom: 6,
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        {dates[selectedIndex]}
      </div>

      <div style={{ width: "100%" }}>
        <input
          type="range"
          min={0}
          max={dates.length - 1}
          step={1}
          value={selectedIndex}
          onChange={(e) => onSelectDate(dates[Number(e.target.value)])}
          style={{ width: "100%" }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontSize: 12,
          }}
        >
          {dates.map((date) => (
            <span key={date}>{date}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
