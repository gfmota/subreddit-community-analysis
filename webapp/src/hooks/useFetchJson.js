import { useEffect, useState } from 'react';

// `result.url` tracks which url a resolved fetch belongs to, so `loading` can
// be derived instead of toggled directly in the effect (avoids an extra
// synchronous render before the fetch settles).
export function useFetchJson(url) {
  const [result, setResult] = useState({ url: null, data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        setResult({ url, data: json, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setResult({ url, data: null, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const loading = result.url !== url;
  return {
    data: loading ? null : result.data,
    loading,
    error: loading ? null : result.error,
  };
}
