import { useEffect } from "react";
import { useFetchJson } from "../hooks/useFetchJson";
import { useAppState } from "../state/AppStateContext";

export default function DateSelector() {
  const { selectedDate, selectDate } = useAppState();
  const { data, loading } = useFetchJson("/graph_data/manifest.json");
  const dates = data?.dates ?? [];

  useEffect(() => {
    // Default to the most recent date
    if (!selectedDate && data?.dates?.length > 0) {
      selectDate(data.dates[data.dates.length - 1]);
    }
  }, [data, selectedDate, selectDate]);

  if (loading) {
    return (
      <div
        style={{
          padding: "12px 16px",
          fontSize: 12,
          color: "#666",
          borderBottom: "1px solid #eee",
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
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
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
          onChange={(e) => selectDate(dates[Number(e.target.value)])}
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
