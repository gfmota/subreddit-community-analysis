import duckdb, os, sys

k = 3
n = 2

def create_subreddit_relations(input_file, output_file):
    print(f"Getting top k = {k} subreddits for each user ranked by interactions count with at least {n} interactions to create subreddit relations")

    query = f"""
    COPY(
        WITH user_subreddit_interactions AS (
            SELECT author_hash, subreddit_id, interactions_count
            FROM read_parquet('{input_file}')
            WHERE interactions_count >= {n}
        ),

        ranked AS (
            SELECT
                u.*,
                ROW_NUMBER() OVER (
                    PARTITION BY author_hash
                    ORDER BY interactions_count DESC
                ) AS rn
            FROM user_subreddit_interactions u
        ),

        filtered AS (
            SELECT r.author_hash, r.subreddit_id
            FROM ranked r
            WHERE r.rn <= {k}
        ),

        subreddit_sizes AS (
            SELECT subreddit_id, COUNT(*) AS users
            FROM filtered
            GROUP BY subreddit_id
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

        SELECT
            r.subreddit_id_a,
            r.subreddit_id_b,

            r.shared_users,
            sa.users AS users_a,
            sb.users AS users_b,

            CAST(r.shared_users AS DOUBLE) / (sa.users + sb.users - r.shared_users) AS jaccard,
            CAST(r.shared_users AS DOUBLE) / SQRT(sa.users * sb.users)  AS cosine
        FROM relations r
        JOIN subreddit_sizes sa ON r.subreddit_id_a = sa.subreddit_id
        JOIN subreddit_sizes sb ON r.subreddit_id_b = sb.subreddit_id
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