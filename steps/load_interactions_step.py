import zstandard as zstd
import io
import json
import pandas as pd
import hashlib
from dotenv import load_dotenv
import os
import sys
import gc

load_dotenv()

SALT = os.environ["SALT"]
BATCH_SIZE = 10000

def submissions_input_file(date):
    return f"sources/submissions/RS_{date}.zst"

def comments_input_file(date):
    return f"sources/comments/RC_{date}.zst"

def anonymize_author(author: str) -> str:
    if not author:
        return None

    value = (SALT + author).encode("utf-8")

    return hashlib.sha256(value).hexdigest()


subreddit_map = {}
batch_number = 0

def load_interactions(input_file, output_dir, interaction_type):
    global batch_number
    rows = []
    def output_interactions_file(batch_number):
        return f"{output_dir}/interactions_{batch_number}.parquet"

    with open(input_file, "rb") as fh:
        dctx = zstd.ZstdDecompressor(max_window_size=2147483648)
        with dctx.stream_reader(fh) as reader:
            text_stream = io.TextIOWrapper(reader, encoding='utf-8')

            for _, line in enumerate(text_stream):
                obj = json.loads(line)

                if obj.get("subreddit_type") != "public" or obj.get("author") == "[deleted]":
                    continue
                
                subreddit_id = obj.get("subreddit_id")
                subreddit_name = obj.get("subreddit")

                if not subreddit_id or not subreddit_name:
                    raise Exception(f"Subreddit id and/or name not found in: {obj}")
                
                if subreddit_id not in subreddit_map:
                    subreddit_map[subreddit_id] = {
                        "subreddit_name": subreddit_name,
                        "interaction_count": 1
                    }
                else:
                    subreddit_map[subreddit_id]["interaction_count"] += 1

                row = {
                    "subreddit_id": subreddit_id,
                    "author_hash": anonymize_author(obj.get("author")),
                    "type": interaction_type
                }

                rows.append(row)

                if len(rows) >= BATCH_SIZE:
                    df = pd.DataFrame(rows)
                    output_file = output_interactions_file(batch_number)
                    df.to_parquet(output_file, index=False)
                    del df
                    print(f"saved {output_file}")
                    rows = []
                    gc.collect()
                    batch_number += 1

    if rows:
        df = pd.DataFrame(rows)
        output_file = output_interactions_file(batch_number)
        df.to_parquet(output_file, index=False)
        del df
        batch_number += 1

def main():
    if len(sys.argv) < 2:
        print("Usage: python load_storage.py <date>")
        return

    date = sys.argv[1]
    
    INTERACTIONS_DIR = f"storage/interactions/{date}"
    os.makedirs(INTERACTIONS_DIR, exist_ok=True)
    SUBREDDITS_DIR = f"storage/subreddits/{date}"
    os.makedirs(SUBREDDITS_DIR, exist_ok=True)
    
    SUBMISSIONS_INPUT_FILE = submissions_input_file(date)
    load_interactions(SUBMISSIONS_INPUT_FILE, INTERACTIONS_DIR, "S")
    
    COMMENTS_INPUT_FILE = comments_input_file(date)
    load_interactions(COMMENTS_INPUT_FILE, INTERACTIONS_DIR, "C") 

    subreddit_df = pd.DataFrame([
        {
            "subreddit_id": sid,
            "subreddit_name": data["subreddit_name"],
            "interaction_count": data["interaction_count"]
        }
        for sid, data in subreddit_map.items()
    ])

    subreddit_df.to_parquet(f"{SUBREDDITS_DIR}/subreddits.parquet", index=False)

if __name__ == "__main__":
    main()
