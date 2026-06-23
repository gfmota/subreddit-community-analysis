import duckdb, sys, os

con = duckdb.connect()

MIN_INTERACTIONS = 10

def get_users_interactions(date, output_dir, batch_num):
    return con.execute(f"""
        COPY (
            SELECT
                i.subreddit_id,
                i.author_hash,
                COUNT(*) FILTER (WHERE type = 'S') AS submission_count,
                COUNT(*) FILTER (WHERE type = 'C') AS comment_count
            FROM 'storage/interactions/{date}/*.parquet' i
            WHERE abs(hash(i.author_hash)) % 16 = {batch_num}
            GROUP BY i.subreddit_id, i.author_hash
            HAVING COUNT(*) >= {MIN_INTERACTIONS}
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

    for i in range(16):
        get_users_interactions(date, USERS_DIR, i)
        print(f"Finished batch {i}")

if __name__ == "__main__":
    main()