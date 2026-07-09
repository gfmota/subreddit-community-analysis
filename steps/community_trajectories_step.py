import os, json, glob
import math
from collections import Counter, defaultdict


def discover_dates(network_dir="storage/network"):
    """Find all dates that have a completed network export."""
    dates = []
    for path in sorted(glob.glob(f"{network_dir}/*/web/communities.json")):
        date = path.split("/")[-3]
        dates.append(date)
    return dates


def load_communities_minimal(date, network_dir="storage/network"):
    """Load {id, subreddits} for every community exported for this date."""
    path = f"{network_dir}/{date}/web/communities.json"
    with open(path) as f:
        data = json.load(f)

    return [
        {
            "id": community["id"],
            "subreddits": [sub["name"] for sub in community["subreddits"]],
        }
        for community in data["nodes"]
    ]


def build_idf(data_by_moment):
    """IDF weight per subreddit: rarer subreddits count more toward a match."""
    community_count = 0
    freq = Counter()

    for communities in data_by_moment.values():
        for community in communities:
            community_count += 1
            for s in set(community["subreddits"]):
                freq[s] += 1

    return {
        s: math.log((community_count + 1) / (f + 1))
        for s, f in freq.items()
    }


def weighted_jaccard(a, b, idf):
    sa = set(a)
    sb = set(b)

    inter = sa & sb
    union = sa | sb

    den = sum(idf[x] for x in union)
    if den == 0:
        return 0

    return sum(idf[x] for x in inter) / den


def find_best_matches(data_by_moment, moments, idf, threshold=0.30):
    """For each community, find its best-matching community in the next moment."""
    matches = defaultdict(list)

    for i in range(len(moments) - 1):
        m1, m2 = moments[i], moments[i + 1]

        for c1 in data_by_moment[m1]:
            best_score, best_id = 0, None

            for c2 in data_by_moment[m2]:
                score = weighted_jaccard(c1["subreddits"], c2["subreddits"], idf)
                if score > best_score:
                    best_score, best_id = score, c2["id"]

            if best_score >= threshold:
                matches[(m1, c1["id"])].append(
                    {"moment": m2, "id": best_id, "score": round(best_score, 3)}
                )

    return matches


def build_trajectories(data_by_moment, moments, matches):
    """Chain communities across moments by following each one's best match forward."""
    visited = set()
    trajectories = []

    for moment in moments:
        for community in data_by_moment[moment]:
            key = (moment, community["id"])
            if key in visited:
                continue

            chain = []
            current = key
            while current not in visited:
                visited.add(current)
                chain.append({"moment": current[0], "id": current[1]})
                if current not in matches:
                    break
                nxt = matches[current][0]
                current = (nxt["moment"], nxt["id"])

            trajectories.append(chain)

    return trajectories


def flatten_to_lookup(trajectories):
    """{ "<date>:<community_id>": "<trajectory_id>" } for every community in every date."""
    lookup = {}
    for i, chain in enumerate(trajectories):
        trajectory_id = f"traj_{i}"
        for step in chain:
            lookup[f"{step['moment']}:{step['id']}"] = trajectory_id
    return lookup


def main():
    NETWORK_DIR = "storage/network"
    OUTPUT_DIR = "storage/network/timeseries"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    moments = discover_dates(NETWORK_DIR)
    if not moments:
        print("No processed dates found in storage/network/")
        return

    print(f"Found {len(moments)} dates: {moments}")

    data_by_moment = {
        date: load_communities_minimal(date, NETWORK_DIR) for date in moments
    }

    idf = build_idf(data_by_moment)
    matches = find_best_matches(data_by_moment, moments, idf)
    trajectories = build_trajectories(data_by_moment, moments, matches)
    lookup = flatten_to_lookup(trajectories)

    with open(f"{OUTPUT_DIR}/community_trajectories.json", "w") as f:
        json.dump(lookup, f)

    multi_month = sum(1 for chain in trajectories if len(chain) > 1)
    print(
        f"community_trajectories.json written: {len(trajectories)} trajectories "
        f"({multi_month} spanning multiple months), {len(lookup)} community entries"
    )


if __name__ == "__main__":
    main()
