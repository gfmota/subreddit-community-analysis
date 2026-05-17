import duckdb, sys
import pandas as pd

con = duckdb.connect()

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 400)
pd.set_option("display.max_colwidth", None)


def subreddits_by_name(date, name):
    return con.execute(f"""
    SELECT *
    FROM 'storage/subreddits/{date}/*.parquet'
    WHERE subreddit_name == '{name}'
    """).fetchdf()

def interactions_by_subreddit(date, subreddit_id):
    return con.execute(f"""
    SELECT *
    FROM 'storage/interactions/{date}/*.parquet'
    WHERE subreddit_id == '{subreddit_id}'
    """).fetchdf()

def subreddits_by_author(date, author_hash):
    return con.execute(f"""
        SELECT
            i.subreddit_id,
            s.subreddit_name,
            COUNT(*) AS interactions
        FROM 'storage/interactions/{date}/*.parquet' i
        JOIN 'storage/subreddits/{date}/*.parquet' s
        ON i.subreddit_id = s.subreddit_id
        WHERE i.author_hash = ?
        GROUP BY i.subreddit_id, s.subreddit_name
        ORDER BY interactions DESC
    """, [author_hash]).fetchdf()

def get_users(date):
    return con.execute(f"""
        SELECT
            *
        FROM 'storage/users/{date}/*.parquet'
        LIMIT 10
    """).fetchdf()

def get_relations(date):
    return con.execute(f"""
        SELECT
            *
        FROM 'storage/relations/{date}/*.parquet'
        LIMIT 10
    """).fetchdf()

def main():
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python3 query.py <command> <date> <params>")
        return

    command = sys.argv[1]
    date = sys.argv[2]

    if command == "subreddit":
        if len(sys.argv) < 4:
            print("Usage:")
            print("  python3 query.py subreddit <date> <name>")
            return
        param = sys.argv[3]
        df = subreddits_by_name(date, param)
    elif command == "interactions":
        if len(sys.argv) < 4:
            print("Usage:")
            print("  python3 query.py interactions <date> <subreddit_id>")
            return
        param = sys.argv[3]
        df = interactions_by_subreddit(date, param)
    elif command == "authors_subreddits":
        if len(sys.argv) < 4:
            print("Usage:")
            print("  python3 query.py authors_subreddits <date> <author_hash>")
            return
        param = sys.argv[3]
        df = subreddits_by_author(date, param)
    elif command == "users":
        df = get_users(date)
    elif command == "relations":
        df = get_relations(date)
    else:
        print("Unknown command:", command)
        return

    print(df)


if __name__ == "__main__":
    main()
