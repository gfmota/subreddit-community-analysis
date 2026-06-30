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
        // default to the most recent date if none selected yet
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

  return (
    <select
      value={selectedDate || ""}
      onChange={(e) => onSelectDate(e.target.value)}
      style={{
        position: "absolute",
        bottom: 8,
        left: 8,
        zIndex: 30,
        padding: "6px 10px",
        fontSize: 14,
        borderRadius: 6,
        border: "1px solid #ddd",
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {dates.map((date) => (
        <option key={date} value={date}>
          {date}
        </option>
      ))}
    </select>
  );
}
