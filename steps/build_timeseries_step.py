import os, sys, json, glob
import networkx as nx


def discover_dates(network_dir="storage/network"):
    """Find all dates that have a completed network export."""
    dates = []
    for path in sorted(glob.glob(f"{network_dir}/*/web/communities.json")):
        date = path.split("/")[-3]
        dates.append(date)
    return dates


def compute_centrality(G, top_n=None):
    """
    Betweenness centrality is expensive on large graphs. If top_n is set,
    approximate using a sample of nodes (k parameter) for speed.
    """
    if top_n and G.number_of_nodes() > top_n:
        return nx.betweenness_centrality(G, k=top_n, weight="cosine", seed=42)
    return nx.betweenness_centrality(G, weight="cosine")


def build_subreddit_timeseries(dates, network_dir="storage/network", centrality_sample=None):
    """
    For each date, load the graphml network and extract per-subreddit metrics.
    Output: { subreddit_id: { date: { interactions, users, degree, strength,
                                       centrality, clustering, k_core } } }
    """
    timeseries = {}

    for date in dates:
        graphml_path = f"{network_dir}/{date}/subreddits_network.graphml"

        if not os.path.exists(graphml_path):
            print(f"  Skipping {date}: {graphml_path} not found")
            continue

        print(f"Processing {date}...")
        G = nx.read_graphml(graphml_path)

        degree = dict(G.degree())
        strength = dict(G.degree(weight="shared_users"))

        print(f"  Computing clustering coefficient...")
        clustering = nx.clustering(G, weight="cosine")

        print(f"  Computing k-core...")
        # core_number requires a simple graph with no self-loops
        G_no_selfloops = G.copy()
        G_no_selfloops.remove_edges_from(nx.selfloop_edges(G_no_selfloops))
        core_numbers = nx.core_number(G_no_selfloops)

        print(f"  Computing centrality (this may take a while)...")
        centrality = compute_centrality(G, top_n=centrality_sample)

        for node, attrs in G.nodes(data=True):
            if node not in timeseries:
                timeseries[node] = {
                    "name": attrs.get("name", node),
                    "history": {}
                }

            timeseries[node]["history"][date] = {
                "interactions": int(attrs.get("interactions", 0)),
                "users": int(attrs.get("users", 0)),
                "degree": int(degree.get(node, 0)),
                "strength": int(strength.get(node, 0)),
                "centrality": round(float(centrality.get(node, 0.0)), 8),
                "clustering": round(float(clustering.get(node, 0.0)), 6),
                "k_core": int(core_numbers.get(node, 0)),
                "community": attrs.get("community")
            }

        print(f"  Done. {G.number_of_nodes():,} nodes processed")

    return timeseries


def main():
    NETWORK_DIR = "storage/network"
    OUTPUT_DIR = "storage/network/timeseries"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    dates = discover_dates(NETWORK_DIR)

    if not dates:
        print("No processed dates found in storage/network/")
        return

    print(f"Found {len(dates)} dates: {dates}")

    # manifest of available dates for the interface date selector
    manifest = {"dates": dates}
    with open(f"{OUTPUT_DIR}/manifest.json", "w") as f:
        json.dump(manifest, f)
    print(f"manifest.json written with {len(dates)} dates")

    # cross-month subreddit metrics
    timeseries = build_subreddit_timeseries(dates, NETWORK_DIR)

    # reshape into a flat structure for easier frontend consumption
    output = [
        {
            "id": subreddit_id,
            "name": data["name"],
            "history": data["history"]
        }
        for subreddit_id, data in timeseries.items()
    ]

    with open(f"{OUTPUT_DIR}/subreddit_timeseries.json", "w") as f:
        json.dump(output, f)

    print(f"subreddit_timeseries.json written: {len(output):,} subreddits tracked across {len(dates)} dates")


if __name__ == "__main__":
    main()