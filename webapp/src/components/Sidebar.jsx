import DateSelector from "./DateSelector";
import SearchBar from "./SearchBar";

export default function Sidebar({ filters, children }) {
  return (
    <div
      style={{
        width: 340,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #eee",
        background: "white",
      }}
    >
      <SearchBar />
      <div style={{ flex: 1, overflowY: "auto", padding: 8, minHeight: 0 }}>
        {children}
      </div>
      {filters}
      <DateSelector />
    </div>
  );
}
