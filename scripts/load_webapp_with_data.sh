#!/bin/bash

DEST="webapp/public/graph_data"
mkdir -p "$DEST"

# cross-month files
cp storage/network/timeseries/manifest.json "$DEST/"
cp storage/network/timeseries/subreddit_timeseries.json "$DEST/"
cp storage/network/timeseries/community_trajectories.json "$DEST/"

# optional: only present if `make apply-labels` has been run
if [ -f storage/network/timeseries/community_labels.json ]; then
    cp storage/network/timeseries/community_labels.json "$DEST/"
    echo "Copied community labels"
fi

# per-date files
for date_dir in storage/network/*/; do
    date=$(basename "$date_dir")

    # skip the timeseries folder itself, it's not a date
    if [ "$date" == "timeseries" ]; then
        continue
    fi

    src="$date_dir/web"
    if [ -d "$src" ]; then
        mkdir -p "$DEST/$date"
        cp "$src"/*.json "$DEST/$date/"
        echo "Copied $date"
    fi
done

echo "Done. Files in $DEST"