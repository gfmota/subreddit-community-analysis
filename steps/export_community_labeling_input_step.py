import os, json, glob
from collections import defaultdict

TOP_N_SUBREDDITS = 30


def discover_dates(network_dir="storage/network"):
    """Find all dates that have a completed network export."""
    dates = []
    for path in sorted(glob.glob(f"{network_dir}/*/web/communities.json")):
        date = path.split("/")[-3]
        dates.append(date)
    return dates


def load_communities(date, network_dir="storage/network"):
    """{ community_id: community } for every community exported for this date."""
    path = f"{network_dir}/{date}/web/communities.json"
    with open(path) as f:
        data = json.load(f)
    return {str(community["id"]): community for community in data["nodes"]}


def top_subreddits_across_trajectory(members, communities_by_date):
    """Union of subreddit names across every (date, community_id) in the
    trajectory, ranked by cumulative interactions and capped to the top N."""
    interactions_by_name = defaultdict(int)

    for date, community_id in members:
        community = communities_by_date.get(date, {}).get(community_id)
        if not community:
            continue
        for sub in community["subreddits"]:
            interactions_by_name[sub["name"]] += sub["interactions"]

    ranked = sorted(interactions_by_name.items(), key=lambda kv: kv[1], reverse=True)
    return [name for name, _ in ranked[:TOP_N_SUBREDDITS]]


def main():
    NETWORK_DIR = "storage/network"
    TIMESERIES_DIR = "storage/network/timeseries"
    TRAJECTORIES_PATH = f"{TIMESERIES_DIR}/community_trajectories.json"
    OUTPUT_PATH = f"{TIMESERIES_DIR}/community_labeling_input.json"

    if not os.path.exists(TRAJECTORIES_PATH):
        print(f"{TRAJECTORIES_PATH} not found. Run `make run-trajectories` first.")
        return

    with open(TRAJECTORIES_PATH) as f:
        trajectories = json.load(f)  # "<date>:<community_id>" -> trajectory_id

    dates = discover_dates(NETWORK_DIR)
    if not dates:
        print("No processed dates found in storage/network/")
        return

    communities_by_date = {date: load_communities(date, NETWORK_DIR) for date in dates}

    by_trajectory = defaultdict(list)
    for key, trajectory_id in trajectories.items():
        date, community_id = key.split(":", 1)
        by_trajectory[trajectory_id].append((date, community_id))

    output = []
    for trajectory_id, members in sorted(by_trajectory.items()):
        members.sort(key=lambda m: m[0])

        output.append({
            "trajectory_id": trajectory_id,
            "communities": [
                {"date": date, "community_id": community_id}
                for date, community_id in members
            ],
            "subreddits": top_subreddits_across_trajectory(members, communities_by_date),
        })

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"{OUTPUT_PATH} written: {len(output)} trajectories to label")


if __name__ == "__main__":
    main()
