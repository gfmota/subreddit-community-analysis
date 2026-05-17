import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import duckdb
from networkx.algorithms.community import greedy_modularity_communities

def plot(date):
    edges = duckdb.sql(f"""
    WITH relations AS (SELECT * FROM read_parquet('storage/relations/{date}/*.parquet')),
    subreddits AS (SELECT * FROM read_parquet('storage/subreddits/{date}/*.parquet'))
    SELECT s1.subreddit_name as subreddit_name_a, s2.subreddit_name as subreddit_name_b, r.shared_users
    FROM relations r
    JOIN subreddits s1 ON s1.subreddit_id = r.subreddit_id_a
    JOIN subreddits s2 ON s2.subreddit_id = r.subreddit_id_b
    WHERE r.shared_users > 500
    """).df() 

    TOP_K = 3

    edges = (
        edges
        .sort_values(
            ["subreddit_name_a", "shared_users"],
            ascending=[True, False]
        )
        .groupby("subreddit_name_a")
        .head(TOP_K)
    )

    G = nx.from_pandas_edgelist( 
        edges, 
        source="subreddit_name_a", 
        target="subreddit_name_b", 
        edge_attr="shared_users"
    )

    plt.figure(figsize=(16, 16))

    # Layout
    pos = nx.spring_layout(
        G,
        k=2,
        iterations=1000,
        seed=673,
        weight=None
    )

    # Edge weights
    weights = [G[u][v]["shared_users"] for u, v in G.edges()]

    # Scale edge widths
    edge_widths = [0.5 + np.log10(w) for w in weights]

    # Node sizes based on degree
    degrees = dict(G.degree())
    node_sizes = [degrees[n] * 20 for n in G.nodes()]

    communities = greedy_modularity_communities(G)

    node_colors = {}

    for i, comm in enumerate(communities):
        for node in comm:
            node_colors[node] = i

    colors = [node_colors[n] for n in G.nodes()]

    nx.draw_networkx_nodes(
        G,
        pos,
        node_size=node_sizes,
        node_color=colors,
        alpha=0.8
    )

    nx.draw_networkx_edges(
        G,
        pos,
        width=edge_widths,
        alpha=0.1
    )

    # Optional labels
    nx.draw_networkx_labels(
        G,
        pos,
        font_size=6
    )

    plt.title("Subreddit Shared User Network")
    plt.axis("off")
    plt.savefig(
        "reddit_network.png",
        dpi=300,
        bbox_inches="tight"
    )

def main():
    if len(sys.argv) < 2:
        print("Usage: python load_storage.py <date>")
        return

    date = sys.argv[1]
    plot(date)

if __name__ == "__main__":
    main()