import sys, json


def main():
    if len(sys.argv) < 2:
        print("Usage: python apply_community_labels_step.py <llm_output.json>")
        return

    llm_output_path = sys.argv[1]
    INPUT_PATH = "storage/network/timeseries/community_labeling_input.json"
    OUTPUT_PATH = "storage/network/timeseries/community_labels.json"

    with open(INPUT_PATH) as f:
        expected = json.load(f)
    expected_ids = {t["trajectory_id"] for t in expected}

    with open(llm_output_path) as f:
        labels = json.load(f)

    seen_ids = set()
    result = {}
    for entry in labels:
        trajectory_id = entry.get("trajectory_id")

        if trajectory_id not in expected_ids:
            print(f"Warning: '{trajectory_id}' is not a known trajectory id, skipping")
            continue
        if not entry.get("community_label"):
            print(f"Warning: '{trajectory_id}' has no community_label, skipping")
            continue

        seen_ids.add(trajectory_id)
        result[trajectory_id] = {
            "label": entry["community_label"],
            "description": entry.get("description", ""),
        }

    missing = sorted(expected_ids - seen_ids)
    if missing:
        preview = missing[:10]
        suffix = "..." if len(missing) > 10 else ""
        print(
            f"{len(missing)} trajectories have no label and will fall back to "
            f"their id in the interface: {preview}{suffix}"
        )

    with open(OUTPUT_PATH, "w") as f:
        json.dump(result, f, indent=2)

    print(f"{OUTPUT_PATH} written: {len(result)} of {len(expected_ids)} trajectories labeled")


if __name__ == "__main__":
    main()
