import zstandard as zstd
import io
import json
import pandas as pd
import hashlib
from dotenv import load_dotenv
import os

load_dotenv()

SALT = os.environ["SALT"]
SUBMISSIONS_INPUT_FILE = "sources/RS_2019-04.zst"
COMMENTS_INPUT_FILE = "sources/RC_2019-04.zst"
BATCH_SIZE = 100000

def output_interactions_file(batch_number):
    return f"storage/interactions/interactions_{batch_number}.parquet"

def anonymize_author(author: str) -> str:
    if not author:
        return None

    value = (SALT + author).encode("utf-8")

    return hashlib.sha256(value).hexdigest()


subreddit_map = {}
batch_number = 0

def load_interactions(input_file, interaction_type):
    global batch_number
    rows = []

    with open(input_file, "rb") as fh:
        dctx = zstd.ZstdDecompressor()
        with dctx.stream_reader(fh) as reader:
            text_stream = io.TextIOWrapper(reader, encoding='utf-8')

            for _, line in enumerate(text_stream):
                obj = json.loads(line)

                if obj.get("subreddit_type") != "public" or obj.get("author") == "[deleted]":
                    continue
                
                subreddit_id = obj.get("subreddit_id")
                subreddit_name = obj.get("subreddit")

                if subreddit_id and subreddit_name:
                    subreddit_map[subreddit_id] = subreddit_name

                row = {
                    "subreddit_id": subreddit_id,
                    "author_hash": anonymize_author(obj.get("author")),
                    "created_utc": obj.get("created_utc"),
                    "type": interaction_type
                }

                rows.append(row)

                if len(rows) >= BATCH_SIZE:
                    df = pd.DataFrame(rows)
                    output_file = output_interactions_file(batch_number)
                    df.to_parquet(output_file, index=False)
                    print(f"saved {output_file}")
                    rows = []
                    batch_number += 1

    if rows:
        df = pd.DataFrame(rows)
        output_file = output_interactions_file(batch_number)
        df.to_parquet(output_file, index=False)

load_interactions(SUBMISSIONS_INPUT_FILE, "S") 
load_interactions(COMMENTS_INPUT_FILE, "C") 

subreddit_df = pd.DataFrame([
    {
        "subreddit_id": sid,
        "subreddit_name": name
    }
    for sid, name in subreddit_map.items()
])
subreddit_df.to_parquet("storage/subreddits/subreddits.parquet", index=False)