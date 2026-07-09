import { useEffect, useState } from "react";

let cachedTimeseries = null; // module-level cache, fetched once for the whole app session

export function useTimeseries() {
  const [data, setData] = useState(cachedTimeseries);
  const [loading, setLoading] = useState(!cachedTimeseries);

  useEffect(() => {
    if (cachedTimeseries) return;

    fetch("/graph_data/subreddit_timeseries.json")
      .then((r) => {
        if (!r.ok)
          throw new Error(
            `Failed to load subreddit_timeseries.json: ${r.status}`,
          );
        return r.json();
      })
      .then((all) => {
        cachedTimeseries = all;
        setData(all);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
