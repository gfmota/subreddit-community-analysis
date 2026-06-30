import os, sys
import leidenalg
import igraph as ig
import duckdb
import networkx as nx
import pandas as pd

con = duckdb.connect()

def identify_communities(relations_df, subreddits_df):
    G = nx.from_pandas_edgelist(
        relations_df,
        source="subreddit_id_a",
        target="subreddit_id_b",
        edge_attr=["shared_users", "jaccard", "cosine"]
    )

    # build node attributes from subreddits_df
    users_a = relations_df[["subreddit_id_a", "users_a"]].rename(
        columns={"subreddit_id_a": "subreddit_id", "users_a": "users"}
    )
    users_b = relations_df[["subreddit_id_b", "users_b"]].rename(
        columns={"subreddit_id_b": "subreddit_id", "users_b": "users"}
    )
    users_df = pd.concat([users_a, users_b]).groupby("subreddit_id")["users"].max().reset_index()

    # merge everything into one node dataframe
    node_df = (
        subreddits_df[["subreddit_id", "subreddit_name", "interaction_count"]]
        .merge(users_df, on="subreddit_id", how="inner")
    )

    # set node attributes
    for _, row in node_df.iterrows():
        if row["subreddit_id"] in G.nodes:
            G.nodes[row["subreddit_id"]]["name"] = row["subreddit_name"]
            G.nodes[row["subreddit_id"]]["users"] = int(row["users"])
            G.nodes[row["subreddit_id"]]["interactions"] = int(row["interaction_count"])
    
    # select largest component
    largest_cc = max(nx.connected_components(G), key=len)
    G_largest = G.subgraph(largest_cc).copy()
    
    # convert to igraph
    G_ig = ig.Graph.from_networkx(G_largest)

    # build edge weights from cosine
    partition = leidenalg.find_partition(
        G_ig,
        leidenalg.RBConfigurationVertexPartition,
        weights=G_ig.es["cosine"],
        resolution_parameter=1.0,
        seed=42
    )
    G_ig.vs["community"] = partition.membership
    return G_ig.to_networkx()

def main():
    if len(sys.argv) < 2:
        print("Usage: python identify_communities.py <date>")
        return

    date = sys.argv[1]
    
    CLEAR_RELATIONS_INPUT = f"storage/relations/{date}/clean_relations.parquet"
    SUBREDDITS_INPUT = f"storage/subreddits/{date}/subreddits.parquet"
    NETWORK_DIR = f"storage/network/{date}"
    os.makedirs(NETWORK_DIR, exist_ok=True)
    OUTPUT_NETWORK_FILE = f"{NETWORK_DIR}/subreddits_network.graphml"
    
    subreddits_df = con.execute(f"SELECT * FROM '{SUBREDDITS_INPUT}'").df()
    relations_df = con.execute(f"SELECT * FROM '{CLEAR_RELATIONS_INPUT}'").df()
    
    G = identify_communities(relations_df, subreddits_df)
    
    nx.write_graphml(G, OUTPUT_NETWORK_FILE)

if __name__ == "__main__":
    main()
