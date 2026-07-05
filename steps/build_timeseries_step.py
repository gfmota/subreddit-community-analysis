import os, json, glob
from collections import defaultdict
import networkx as nx


def discover_dates(network_dir="storage/network"):
    """Find all dates that have a completed network export."""
    dates = []
    for path in sorted(glob.glob(f"{network_dir}/*/web/communities.json")):
        date = path.split("/")[-3]
        dates.append(date)
    return dates

def compute_community_metrics(G, centrality_sample=None):
    communities = defaultdict(list)

    for node, attrs in G.nodes(data=True):
        community = attrs.get("community")

        if community is not None:
            communities[community].append(node)

    metrics = {}

    for community, nodes in communities.items():
        SG = G.subgraph(nodes).copy()

        degree = dict(SG.degree())
        strength = dict(SG.degree(weight="shared_users"))

        clustering = nx.clustering(
            SG,
            weight="cosine"
        )

        SG_core = SG.copy()
        SG_core.remove_edges_from(nx.selfloop_edges(SG_core))

        if SG_core.number_of_edges() > 0:
            core_numbers = nx.core_number(SG_core)
        else:
            core_numbers = {n: 0 for n in SG.nodes()}

        centrality = compute_centrality(
            SG,
            top_n=centrality_sample
        )

        for node in SG.nodes():
            metrics[node] = {
                "community_degree": int(degree.get(node, 0)),
                "community_strength": int(strength.get(node, 0)),
                "community_centrality": round(float(centrality.get(node, 0)), 8),
                "community_clustering": round(float(clustering.get(node, 0)), 6),
                "community_k_core": int(core_numbers.get(node, 0)),
            }

    return metrics

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
        
        community_metrics = compute_community_metrics(
            G,
            centrality_sample=centrality_sample
        )

        for node, attrs in G.nodes(data=True):
            if node not in timeseries:
                timeseries[node] = {
                    "name": attrs.get("name", node),
                    "history": {}
                }

            community = community_metrics.get(node, {})

            timeseries[node]["history"][date] = {
                "interactions": int(attrs.get("interactions", 0)),
                "users": int(attrs.get("users", 0)),
                "degree": int(degree.get(node, 0)),
                "strength": int(strength.get(node, 0)),
                "centrality": round(float(centrality.get(node, 0.0)), 8),
                "clustering": round(float(clustering.get(node, 0.0)), 6),
                "k_core": int(core_numbers.get(node, 0)),
                "community_degree": community.get("community_degree", 0),
                "community_strength": community.get("community_strength", 0),
                "community_centrality": community.get("community_centrality", 0.0),
                "community_clustering": community.get("community_clustering", 0.0),
                "community_k_core": community.get("community_k_core", 0),
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