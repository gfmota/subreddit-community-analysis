import { useTimeseries } from "../hooks/useTimeseries";
import MetricBarChart from "./MetricBarChart";

const METRICS = [
  { label: "Interactions", metricKey: "interactions", color: "#6366f1" },
  { label: "Users", metricKey: "users", color: "#22c55e" },
  { label: "Degree", metricKey: "degree", color: "#f59e0b" },
  { label: "Strength", metricKey: "strength", color: "#ef4444" },
  {
    label: "Community Strength",
    metricKey: "community_strength",
    color: "#ef4444",
  },
  {
    label: "Betweenness centrality",
    metricKey: "centrality",
    color: "#06b6d4",
  },
  {
    label: "Community centrality (Betweenness)",
    metricKey: "community_centrality",
    color: "#06b6d4",
  },
  {
    label: "Clustering coefficient",
    metricKey: "clustering",
    color: "#ec4899",
  },
  {
    label: "Community Clustering coefficient",
    metricKey: "community_clustering",
    color: "#ec4899",
  },
  { label: "K-core", metricKey: "k_core", color: "#8b5cf6" },
];

export default function SubredditHistory({ subredditId }) {
  const { data, loading } = useTimeseries();

  if (loading) {
    return (
      <div style={{ fontSize: 12, color: "#666" }}>Loading history...</div>
    );
  }

  if (!data) {
    return null;
  }

  const subreddit = data.find((s) => s.id === subredditId);

  // build the full date range across ALL subreddits, not just this one,
  // so every chart shares a consistent x axis regardless of when this
  // particular subreddit appears or disappears
  const allDatesSet = new Set();
  data.forEach((s) => {
    Object.keys(s.history || {}).forEach((d) => allDatesSet.add(d));
  });
  const allDates = Array.from(allDatesSet).sort();

  if (
    !subreddit ||
    !subreddit.history ||
    Object.keys(subreddit.history).length === 0
  ) {
    return (
      <div style={{ fontSize: 12, color: "#999" }}>
        No historical data available.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 12 }}>History ({allDates.length} months)</h3>
      {METRICS.map((m) => (
        <MetricBarChart
          key={m.metricKey}
          label={m.label}
          history={subreddit.history}
          allDates={allDates}
          metricKey={m.metricKey}
          color={m.color}
        />
      ))}
    </div>
  );
}
