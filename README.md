# Subreddit communities analysis

This repository contains code dedicated to process subreddit historical data (comments and submissions)
and analyze subreddit and user relations, trying to find subreddit communities.

It uses a bipartite network between users and subreddits to map subreddits that share users.
Edge weights between subreddits are computed using the Jaccard similarity index, representing
the fraction of users shared relative to the total user base of both subreddits.

## Processing pipeline

### Source data

Historical data from Reddit comments and submissions. Source files are organized by year and month,
one file for comments and one for submissions, due to data size.

Expected locations:

- Comments: `sources/comments/RC_<YEAR>-<MONTH>.zst`
- Submissions: `sources/submissions/RS_<YEAR>-<MONTH>.zst`

Sample comment record:

```json
{
  "author": "<AUTHOR-NAME>",
  "body": "<COMMENT-BODY>",
  "subreddit": "<SUBREDDIT-NAME>",
  "subreddit_id": "<SUBREDDIT-ID>",
  "subreddit_type": "public",
  "created_utc": 1577836827,
  "id": "<COMMENT-ID>"
}
```

Sample submission record:

```json
{
  "author": "<AUTHOR-NAME>",
  "title": "<SUBMISSION-TITLE>",
  "subreddit": "<SUBREDDIT-NAME>",
  "subreddit_id": "<SUBREDDIT-ID>",
  "subreddit_type": "public",
  "created_utc": 1577836811,
  "id": "<SUBMISSION-ID>"
}
```

---

### Step 1 — Load interactions (`load_interactions_step.py`)

Reads raw `.zst` files and transforms them into flat interaction records and a subreddit index.

**Filters applied:**

- Only public subreddits are included (`subreddit_type == "public"`)
- Deleted authors are removed (`author == "[deleted]"`)
- Authors with a missing or empty `author` field are skipped

**Privacy:** author names are anonymized using salted SHA-256 hashes. The original username cannot
be recovered without the salt.

#### Interactions

Location: `storage/interactions/<date>/interactions_*.parquet`

| column       | type   | description                     |
| ------------ | ------ | ------------------------------- |
| subreddit_id | string | Reddit subreddit identifier     |
| author_hash  | string | Salted SHA-256 hash of username |
| type         | string | `S` = submission, `C` = comment |

#### Subreddits

Location: `storage/subreddits/<date>/subreddits.parquet`

| column            | type   | description                   |
| ----------------- | ------ | ----------------------------- |
| subreddit_id      | string | Reddit subreddit identifier   |
| subreddit_name    | string | Human-readable subreddit name |
| interaction_count | int64  | Total interactions collected  |

---

### Step 2 — User interactions (`user_interactions_step.py`)

Aggregates raw interactions into one record per (user, subreddit) pair, counting interactions, for the top 5% subreddits, ranked by interactions count, according to decision made in [Subreddits relevance investigation notebook](./notebooks/subreddits_relevance_investigation.ipynb).

**Notes:**

- Processed in batches using DuckDB's `hash()` function for stable, reproducible partitioning.

#### User interactions

Location: `storage/users/<date>/users_<batch_num>.parquet`

| column             | type   | description                                 |
| ------------------ | ------ | ------------------------------------------- |
| subreddit_id       | string | Reddit subreddit identifier                 |
| author_hash        | string | Salted SHA-256 hash of username             |
| interactions_count | int64  | Number of comments+submissions by this user |

---

### Step 3 — Subreddit relations (`subreddit_relations_step.py`)

Creates edges between subreddits. Two subreddits are linked if they share at least one user.
To define what is an user participating in a subreddit, it gets the top 3 subreddits from each
user, ranked by interactions count, with at least 2 interactions. The explanation on this decision is in [User behavior investigation notebook](./notebooks/user_behavior_investigation.ipynb).

For each relation we calculate both, Jaccard and Cossine, similarities, so we can process
once and choose later which is going to be our method of weight;

```
jaccard = shared_users / (users_a + users_b - shared_users)
```

```
cossine = shared_users / SQRT(users_a * users_b)
```

#### Relations

Location: `storage/relations/<date>/relations.parquet`

| column         | type   | description                                   |
| -------------- | ------ | --------------------------------------------- |
| subreddit_id_a | string | First subreddit                               |
| subreddit_id_b | string | Second subreddit                              |
| shared_users   | int64  | Number of users present in both               |
| jaccard        | float  | Jaccard similarity between the two subreddits |
| cossine        | float  | Cossine similarity between the two subreddits |

---

### Step 4 — Filter relations (`filter_relations_step.py`)

Filters the full relations file to retain only the strongest edges, based on a Jaccard weight
percentile threshold. This removes weak connections (e.g. two large subreddits that share a small
fraction of users) while preserving tight niche communities.

**Parameters:**

| parameter           | default | description                                     |
| ------------------- | ------- | ----------------------------------------------- |
| `WEIGHT_PERCENTILE` | `0.9`   | Keep only edges above this percentile of weight |

The threshold value is computed dynamically from the data and printed during execution.

#### Filtered relations

Location: `storage/relations/<date>/relations_filtered.parquet`

Same schema as `relations.parquet`. The unfiltered file is preserved so the threshold can be
adjusted and this step re-run without repeating the expensive self-join in step 3.

---

## How to run

### Env setup

Create the venv:

```sh
python3 -m venv .venv
```

Activate it:

```sh
source .venv/bin/activate
```

Install dependencies:

```sh
pip install -r requirements.txt
```

### Local env vars

Create a `.env` file with:

```
SALT=<USER-HASH-SALT>
```

| variable | description                                                               |
| -------- | ------------------------------------------------------------------------- |
| `SALT`   | Prepended to usernames before hashing. Ensures users are not identifiable |

### Data setup

Place source files in the following directories:

```
sources/
  comments/
    RC_<YEAR>-<MONTH>.zst
  submissions/
    RS_<YEAR>-<MONTH>.zst
```

Example: `RC_2020-01.zst`, `RS_2020-01.zst`.

### Running the pipeline

```sh
make run-pipeline DATE=<YEAR>-<MONTH>
```

This runs all four steps in order. Intermediate outputs are written to `storage/` and can be
inspected independently between steps.
