import { useAppState } from "../state/AppStateContext";

export default function OverviewGuide({ stats }) {
  const { selectedDate } = useAppState();

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Subreddit Network Explorer</h2>
      <p style={{ color: "#444", lineHeight: 1.5, fontSize: 14 }}>
        Each node is a community of subreddits whose users frequently overlap.
        Node size reflects how many subreddits belong to it.
      </p>
      <p style={{ color: "#444", lineHeight: 1.5, fontSize: 14 }}>
        Click a community to preview it, then zoom in to explore its subreddits.
        Use the search bar above to jump straight to a subreddit you know.
      </p>
      <p style={{ color: "#444", lineHeight: 1.5, fontSize: 14 }}>
        {`This graph is a snapshot in time of the month ${selectedDate}.`}
        Use the slider to change the date of the snapshot and view communities
        in other moments.
      </p>
      {stats && (
        <p
          style={{
            color: "#666",
            fontSize: 13,
            marginTop: 24,
            borderTop: "1px solid #eee",
            paddingTop: 12,
          }}
        >
          This snapshot has {stats.nodes} communities and {stats.edges}{" "}
          inter-community links.
        </p>
      )}
    </div>
  );
}
