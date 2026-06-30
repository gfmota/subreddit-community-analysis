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

Location: `storage/relations/<date>/raw_relations.parquet`

| column         | type   | description                                   |
| -------------- | ------ | --------------------------------------------- |
| subreddit_id_a | string | First subreddit                               |
| subreddit_id_b | string | Second subreddit                              |
| users_a        | int64  | Amount of users in first subreddit            |
| users_b        | int64  | Amount of users in second subreddit           |
| shared_users   | int64  | Number of users present in both               |
| jaccard        | float  | Jaccard similarity between the two subreddits |
| cosine         | float  | Cosine similarity between the two subreddits  |

---

### Step 4 — Filter relations (`filter_relations_step.py`)

Filters the full relations file to retain only the strongest edges, based on a minimum shared user threshold and on backbone extraction via disparity filter. Decision made based on [Subreddit relations investigation](./notebooks/subreddit_relations_investigation.ipynb) discoveries.

**Parameters:**

| parameter          | default | description                                                   |
| ------------------ | ------- | ------------------------------------------------------------- |
| `MIN_SHARED_USERS` | `10`    | Keep only edges with at least `MIN_SHARED_USERS` shared users |
| `ALPHA`            | `0.2`   | Disparity filter's alpha                                      |

#### Filtered relations

Location: `storage/relations/<date>/clean_relations.parquet`

Same schema as `raw_relations.parquet`. The unfiltered file is preserved so the threshold can be
adjusted and this step re-run without repeating the expensive self-join in step 3.

### Step 5 — Identify communities (`identify_communities.py`)

Builds a weighted undirected graph from the filtered relations, restricts it to the largest
connected component, and detects communities using the Leiden algorithm.

**Parameters:**

| parameter    | default | description                                                            |
| ------------ | ------- | ---------------------------------------------------------------------- |
| `resolution` | `1.0`   | Controls community granularity. Lower merges more, higher splits more. |
| `seed`       | `42`    | Random seed for reproducibility                                        |

**Node attributes preserved in output:**

| attribute      | description                             |
| -------------- | --------------------------------------- |
| `name`         | Human-readable subreddit name           |
| `users`        | Number of users in the subreddit        |
| `interactions` | Total interactions collected            |
| `community`    | Community identifier assigned by Leiden |

**Edge attributes preserved in output:**

| attribute      | description                                   |
| -------------- | --------------------------------------------- |
| `shared_users` | Number of users present in both subreddits    |
| `jaccard`      | Jaccard similarity between the two subreddits |
| `cosine`       | Cosine similarity between the two subreddits  |

#### Network

Location: `storage/network/<date>/subreddits_network.graphml`

GraphML format. Preserves all node and edge attributes and can be loaded directly into Gephi
for exploration or into networkx for further analysis.

---

### Step 6 — Export network for web interface (`export_network_step.py`)

Reads the GraphML network file and exports it as a set of static JSON files structured for
consumption by the web interface. No graph computation is performed in this step — it is a
pure format transformation.

The output is split into three file types to minimize initial load time: the community overview
is loaded upfront, individual community detail files are fetched on demand when a user drills
into a community, and the search index enables subreddit lookup across all communities without
loading the full graph.

#### Output files

Location: `storage/network/<date>/web/`

**`communities.json`** — community-level graph for the overview screen.

Nodes represent communities. Edges represent inter-community connections (subreddits in
different communities that are directly linked).

Node schema:

| field                | description                                                |
| -------------------- | ---------------------------------------------------------- |
| `id`                 | Community identifier                                       |
| `size`               | Number of subreddits in the community                      |
| `label`              | Name of the highest-interaction subreddit in the community |
| `top_subreddits`     | List of up to 5 top subreddits by interaction count        |
| `total_interactions` | Sum of interaction counts across all community members     |
| `total_users`        | Sum of user counts across all community members            |

Edge schema:

| field          | description                                       |
| -------------- | ------------------------------------------------- |
| `source`       | Source community id                               |
| `target`       | Target community id                               |
| `shared_users` | Shared users between the two connected subreddits |
| `cosine`       | Cosine similarity of the connecting edge          |

**`community_{id}.json`** — subreddit-level graph for the community detail screen.

One file per community. Nodes are subreddits, edges are relations within the community.

Node schema:

| field          | description                             |
| -------------- | --------------------------------------- |
| `id`           | Subreddit identifier                    |
| `name`         | Human-readable subreddit name           |
| `interactions` | Total interactions collected            |
| `users`        | Number of users in the subreddit        |
| `degree`       | Number of connections in the full graph |
| `strength`     | Sum of shared_users across all edges    |

Edge schema:

| field          | description                                   |
| -------------- | --------------------------------------------- |
| `source`       | Source subreddit id                           |
| `target`       | Target subreddit id                           |
| `shared_users` | Number of users present in both subreddits    |
| `cosine`       | Cosine similarity between the two subreddits  |
| `jaccard`      | Jaccard similarity between the two subreddits |

**`search_index.json`** — flat list of all subreddits with their community assignment, used
by the search bar to locate a subreddit and navigate to its community without loading all
community files upfront.

| field          | description                        |
| -------------- | ---------------------------------- |
| `id`           | Subreddit identifier               |
| `name`         | Human-readable subreddit name      |
| `community_id` | Community the subreddit belongs to |

### Step 7 — Build timeseries (`build_timeseries_step.py`)

Aggregates per-subreddit metrics across all processed months into a single cross-month dataset,
enabling time-based exploration in the web interface.

This step scans `storage/network/` for all dates that have a completed network export, loads
each month's GraphML network, and extracts per-subreddit metrics.

**Important notes:**

- A subreddit only has an entry for a given month if it existed in that month's filtered and
  backboned network. Months where a subreddit didn't meet the activity threshold or was removed
  by backbone extraction are simply absent from its history — there is no null-filling.
- Community assignment from `identify_communities.py` is preserved per month, since a subreddit's
  community membership can shift between months as the network evolves.

#### Output files

Location: `storage/network/timeseries/`

**`manifest.json`** — list of all available dates, used to populate the date selector in the
web interface.

| field   | description                                         |
| ------- | --------------------------------------------------- |
| `dates` | List of date strings, e.g. `["2020-01", "2020-02"]` |

**`subreddit_timeseries.json`** — per-subreddit metrics across all months.

| field     | description                     |
| --------- | ------------------------------- |
| `id`      | Subreddit identifier            |
| `name`    | Human-readable subreddit name   |
| `history` | Object keyed by date, see below |

Each entry under `history` has the following shape:

| field          | description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| `interactions` | Total interactions that month                                                    |
| `users`        | Number of users that month                                                       |
| `degree`       | Number of connections in that month's network                                    |
| `strength`     | Sum of shared_users across all edges that month                                  |
| `centrality`   | Betweenness centrality that month (approximated if `centrality_sample` was used) |
| `clustering`   | Clustering coefficient                                                           |
| `k_core`       | k-code                                                                           |
| `community`    | Community id assigned that month                                                 |

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

## Web interface

A standalone React application (Vite + Sigma.js + graphology) provides interactive exploration
of the subreddit network. It reads the static JSON files produced by `export_network_step.py`
from `public/graph_data/` — no backend or live computation is involved.

The interface has two views:

**Community overview** — the default view, showing one node per community, sized by member
count and connected by edges representing inter-community links. Clicking a community zooms
into its detail view.

**Community detail** — shows the subreddits within a selected community as nodes, colored
consistently with their community's color from the overview, connected by their relations.
Clicking a subreddit highlights its direct connections and opens a side panel with its metrics
(interactions, users, degree, strength) and a ranked list of its connections.

A search bar, available from both views, allows looking up a subreddit by name and jumping
directly to its community with the subreddit pre-selected.

### Running the interface

```sh
cd web
npm install
npm run dev
```

Copy the exported JSON files into the app's public directory before running:

```sh
cp storage/network/<date>/web/*.json web/public/graph_data/
```
