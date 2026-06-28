import duckdb, sys, os

con = duckdb.connect()

TOP_SUBREDDITS_PERCENTILE = 0.95
BATCH_AMOUNT = 32

def register_top_subreddits(date):
    con.execute(f"""
        CREATE OR REPLACE VIEW top_subreddits AS
        SELECT subreddit_id
        FROM 'storage/subreddits/{date}/subreddits.parquet'
        WHERE interaction_count >= (
            SELECT percentile_cont({TOP_SUBREDDITS_PERCENTILE})
                   WITHIN GROUP (ORDER BY interaction_count)
            FROM 'storage/subreddits/{date}/subreddits.parquet'
        )
    """)

def persist_users_interactions(date, output_dir, batch_num):
    con.execute(f"""
        COPY (
            SELECT
                i.subreddit_id,
                i.author_hash,
                COUNT(*) AS interactions_count
            FROM 'storage/interactions/{date}/*.parquet' i
            INNER JOIN top_subreddits t ON i.subreddit_id = t.subreddit_id
            WHERE abs(hash(i.author_hash)) % {BATCH_AMOUNT} = {batch_num}
            GROUP BY i.subreddit_id, i.author_hash
        )
        TO '{output_dir}/users_{batch_num}.parquet' (FORMAT PARQUET);
    """)

def main():
    if len(sys.argv) < 2:
        print("Missing date")
        return

    date = sys.argv[1]
    
    USERS_DIR = f"storage/users/{date}"
    os.makedirs(USERS_DIR, exist_ok=True)

    register_top_subreddits(date)
    
    for i in range(BATCH_AMOUNT):
        persist_users_interactions(date, USERS_DIR, i)
        print(f"Finished batch {i}")

if __name__ == "__main__":
    main()