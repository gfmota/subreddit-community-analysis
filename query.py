import duckdb, sys
import pandas as pd

con = duckdb.connect()

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 400)
pd.set_option("display.max_colwidth", None)


def subreddits_by_name(name):
    return con.execute(f"""
    SELECT *
    FROM 'storage/subreddits/*.parquet'
    WHERE subreddit_name == '{name}'
    """).fetchdf()

def interactions_by_subreddit(subreddit_id):
    return con.execute(f"""
    SELECT author_hash
    FROM 'storage/interactions/*.parquet'
    WHERE subreddit_id == '{subreddit_id}'
    """).fetchdf()

def subreddits_by_author(author_hash):
    return con.execute("""
        SELECT
            i.subreddit_id,
            s.subreddit_name,
            COUNT(*) AS interactions
        FROM 'storage/interactions/*.parquet' i
        JOIN 'storage/subreddits/*.parquet' s
        ON i.subreddit_id = s.subreddit_id
        WHERE i.author_hash = ?
        GROUP BY i.subreddit_id, s.subreddit_name
        ORDER BY interactions DESC
    """, [author_hash]).fetchdf()

def main():
    if len(sys.argv) != 3:
        print("Usage:")
        print("  python3 query.py subreddit <name>")
        print("  python3 query.py interactions <subreddit_id>")
        return

    command = sys.argv[1]
    param = sys.argv[2]

    if command == "subreddit":
        df = subreddits_by_name(param)
    elif command == "interactions":
        df = interactions_by_subreddit(param)
    elif command == "authors_subreddits":
        df = subreddits_by_author(param)
    else:
        print("Unknown command:", command)
        return

    print(df)


if __name__ == "__main__":
    main()