import duckdb, os, sys

MIN_INTERACTIONS = 10
MIN_SHARED_USERS = 100


def create_subreddit_relations(input_file, output_file):
    query = f"""
    COPY(
        WITH filtered AS (
            SELECT DISTINCT author_hash, subreddit_id
            FROM read_parquet('{input_file}')
            WHERE interactions >= {MIN_INTERACTIONS}
        ),

        relations AS (
            SELECT
                a.subreddit_id as subreddit_id_a,
                b.subreddit_id as subreddit_id_b,
                COUNT(*) AS shared_users
            FROM filtered a
                JOIN filtered b
                ON a.author_hash = b.author_hash
                AND a.subreddit_id < b.subreddit_id
            GROUP BY 1, 2
        )

        SELECT *
        FROM relations
        WHERE shared_users >= {MIN_SHARED_USERS}
    ) TO '{output_file}' (FORMAT PARQUET);
    """

    con = duckdb.connect()
    con.execute(query)


def main():
    if len(sys.argv) < 2:
        print("Missing date")
        return

    date = sys.argv[1]
    
    OUTPUT_DIR = f'storage/relations/{date}'
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    OUTPUT_FILE = f'{OUTPUT_DIR}/relations.parquet' 
    INPUT_FILE = f'storage/users/{date}/*.parquet'

    create_subreddit_relations(INPUT_FILE, OUTPUT_FILE)

if __name__ == "__main__":
    main()