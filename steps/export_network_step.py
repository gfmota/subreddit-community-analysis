import os, sys, json
import networkx as nx
import pandas as pd


def get_community_nodes(G):
    community_nodes = {}
    for node, attrs in G.nodes(data=True):
        community_id = attrs.get("community")
        if community_id is None:
            continue
        if community_id not in community_nodes:
            community_nodes[community_id] = []
        community_nodes[community_id].append((node, attrs))
    return community_nodes

def export_communities_overview(G, community_nodes, output_dir):
    # build community-level nodes
    nodes = []
    for community_id, members in community_nodes.items():
        members_sorted = sorted(
            members,
            key=lambda x: x[1].get("interactions", 0),
            reverse=True
        )
        top_subreddits = [
            {"id": node, "name": attrs.get("name", node)}
            for node, attrs in members_sorted[:5]
        ]
        nodes.append({
            "id": community_id,
            "size": len(members),
            "label": community_id,
            "top_subreddits": top_subreddits,
            "total_interactions": sum(attrs.get("interactions", 0) for _, attrs in members),
            "total_users": sum(attrs.get("users", 0) for _, attrs in members),
            "subreddits": [
                {
                    "id": node,
                    "name": attrs.get("name", node),
                    "interactions": attrs.get("interactions", 0),
                    "users": attrs.get("users", 0),
                }
                for node, attrs in members_sorted
            ]
        })

    # build inter-community edges
    seen = set()
    edges = []
    for u, v, attrs in G.edges(data=True):
        community_u = G.nodes[u].get("community")
        community_v = G.nodes[v].get("community")

        if community_u is None or community_v is None or community_u == community_v:
            continue

        key = (min(community_u, community_v), max(community_u, community_v))
        if key in seen:
            continue
        seen.add(key)

        edges.append({
            "source": key[0],
            "target": key[1],
        })

    communities_data = {"nodes": nodes, "edges": edges}

    with open(f"{output_dir}/communities.json", "w") as f:
        json.dump(communities_data, f)

    print(f"communities.json: {len(nodes)} communities, {len(edges)} inter-community edges")
    return communities_data


def export_community_files(G, community_nodes, output_dir):
    degree = dict(G.degree())
    strength = dict(G.degree(weight="shared_users"))

    for community_id, members in community_nodes.items():
        member_set = set(node for node, _ in members)

        nodes = [
            {
                "id": node,
                "name": G.nodes[node].get("name", node),
                "interactions": int(G.nodes[node].get("interactions", 0)),
                "users": int(G.nodes[node].get("users", 0)),
                "degree": int(degree.get(node, 0)),
                "strength": int(strength.get(node, 0))
            }
            for node, _ in members
        ]

        edges = [
            {
                "source": u,
                "target": v,
                "shared_users": int(attrs.get("shared_users", 0)),
                "cosine": float(attrs.get("cosine", 0.0)),
                "jaccard": float(attrs.get("jaccard", 0.0))
            }
            for u, v, attrs in G.edges(data=True)
            if u in member_set and v in member_set
        ]

        with open(f"{output_dir}/community_{community_id}.json", "w") as f:
            json.dump({"nodes": nodes, "edges": edges}, f)

    print(f"Exported {len(community_nodes)} community files")


def export_search_index(communities_data, output_dir):
    index = []
    for community in communities_data["nodes"]:
        for subreddit in community.get("subreddits", []):
            index.append({
                "id": subreddit["id"],
                "name": subreddit["name"],
                "community_id": community["id"]
            })

    with open(f"{output_dir}/search_index.json", "w") as f:
        json.dump(index, f)

    print(f"search_index.json: {len(index)} subreddits indexed")


def main():
    if len(sys.argv) < 2:
        print("Usage: python export_network_step.py <date>")
        return

    date = sys.argv[1]

    INPUT_FILE = f"storage/network/{date}/subreddits_network.graphml"
    OUTPUT_DIR = f"storage/network/{date}/web"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Loading graph from {INPUT_FILE}")
    G = nx.read_graphml(INPUT_FILE)
    print(f"Loaded: {G.number_of_nodes():,} nodes, {G.number_of_edges():,} edges")

    community_nodes = get_community_nodes(G)
    communities_data = export_communities_overview(G, community_nodes, OUTPUT_DIR)
    export_community_files(G, community_nodes, OUTPUT_DIR)
    export_search_index(communities_data, OUTPUT_DIR)

    print(f"\nDone. Web files written to {OUTPUT_DIR}/")
    print(f"  communities.json")
    print(f"  community_{{id}}.json  (one per community)")
    print(f"  search_index.json")


if __name__ == "__main__":
    main()
