import duckdb, sys

con = duckdb.connect()

MIN_SHARED_USERS = 10
ALPHA = 0.2

def filter_relations(input_file, output_file):
    con.execute(f"""
        COPY (
            WITH threshold_filter AS (
                SELECT *
                FROM read_parquet('{input_file}')
                WHERE shared_users >= {MIN_SHARED_USERS}
            ),

            edges AS (
                SELECT subreddit_id_a AS subreddit_id, subreddit_id_b AS neighbor, shared_users
                FROM threshold_filter
                UNION ALL
                SELECT subreddit_id_b, subreddit_id_a, shared_users
                FROM threshold_filter
            ),

            strength AS (
                SELECT
                    subreddit_id,
                    SUM(shared_users) AS total_strength,
                    COUNT(*) AS degree
                FROM edges
                GROUP BY 1
            ),

            scored AS (
                SELECT
                    e.subreddit_id,
                    e.neighbor,
                    POWER(1 - e.shared_users / s.total_strength, s.degree - 1) AS p_value
                FROM edges e
                JOIN strength s ON e.subreddit_id = s.subreddit_id
            ),

            backbone AS (
                SELECT DISTINCT
                    CASE WHEN subreddit_id < neighbor THEN subreddit_id ELSE neighbor END AS subreddit_id_a,
                    CASE WHEN subreddit_id < neighbor THEN neighbor ELSE subreddit_id END AS subreddit_id_b
                FROM scored
                WHERE p_value < {ALPHA}
            )

            SELECT
                b.subreddit_id_a,
                b.subreddit_id_b,
                t.shared_users,
                t.users_a,
                t.users_b,
                t.jaccard,
                t.cosine
            FROM backbone b
            JOIN threshold_filter t
                ON b.subreddit_id_a = t.subreddit_id_a
                AND b.subreddit_id_b = t.subreddit_id_b

        ) TO '{output_file}' (FORMAT PARQUET);
    """)

def main():
    if len(sys.argv) < 2:
        print("Missing date")
        return

    date = sys.argv[1]
    
    input_file  = f"storage/relations/{date}/raw_relations.parquet"
    output_file = f"storage/relations/{date}/clean_relations.parquet"

    filter_relations(input_file, output_file)

    print(f"Saved to {output_file}")

if __name__ == "__main__":
    main()