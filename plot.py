import duckdb
import networkx as nx
import matplotlib.pyplot as plt

MIN_USER_INTERACTIONS = 5
MIN_SHARED_USERS = 100

con = duckdb.connect()

query = """
WITH main_subreddit AS (

    SELECT subreddit_id
    FROM 'storage/subreddits/*.parquet'
    WHERE subreddit_name = ?

),

main_users AS (

    SELECT
        author_hash
    FROM 'storage/interactions/*.parquet'
    WHERE subreddit_id = (
        SELECT subreddit_id FROM main_subreddit
    )

    GROUP BY author_hash

),

user_subreddit_interactions AS (

    SELECT
        i.author_hash,
        i.subreddit_id,
        COUNT(*) AS interaction_count
    FROM 'storage/interactions/*.parquet' i

    INNER JOIN main_users mu
    ON i.author_hash = mu.author_hash

    GROUP BY i.author_hash, i.subreddit_id

    HAVING COUNT(*) >= ?

),

subreddit_overlap AS (

    SELECT
        subreddit_id,
        COUNT(DISTINCT author_hash) AS shared_users
    FROM user_subreddit_interactions
    WHERE subreddit_id != (
        SELECT subreddit_id FROM main_subreddit
    )

    GROUP BY subreddit_id

    HAVING COUNT(DISTINCT author_hash) >= ?

)

SELECT
    s.subreddit_name,
    so.shared_users

FROM subreddit_overlap so

JOIN 'storage/subreddits/*.parquet' s
ON so.subreddit_id = s.subreddit_id

ORDER BY so.shared_users DESC
"""

df = con.execute(
    query,
    [
        "Libertarian",
        MIN_USER_INTERACTIONS,
        MIN_SHARED_USERS
    ]
).fetchdf()

print(df.to_string(index=False))
print("===")

df = con.execute(
    query,
    [
        "Conservative",
        MIN_USER_INTERACTIONS,
        MIN_SHARED_USERS
    ]
).fetchdf()

print(df.to_string(index=False))