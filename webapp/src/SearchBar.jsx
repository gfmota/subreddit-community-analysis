import { useState, useEffect, useRef } from "react";

export default function SearchBar({ date, onSelectSubreddit }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(`/graph_data/${date}/search_index.json`)
      .then((r) => {
        if (!r.ok)
          throw new Error(`Failed to load search_index.json: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setIndex(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [date]);

  // close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const lower = q.toLowerCase();
    setResults(
      index.filter((n) => n.name?.toLowerCase().includes(lower)).slice(0, 10),
    );
  };

  const handlePick = (result) => {
    setQuery("");
    setResults([]);
    onSelectSubreddit(result);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 320,
        zIndex: 30,
      }}
    >
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={loading ? "Loading index..." : "Search subreddits..."}
        disabled={loading}
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: 14,
          border: "1px solid #ddd",
          borderRadius: 6,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      />
      {results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "white",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => handlePick(r)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #f1f1f1",
                fontSize: 14,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              r/{r.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
