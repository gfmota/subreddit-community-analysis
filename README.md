# Subreddit communities analysis

This repository contains code dedicated to process subreddit historical data (comments and submissions)
and analyze subreddit and users relations, trying to find subreddits communities.

It uses a bipartite network between users and subreddits to map subreddits that share users.

## Processing pipeline

### Source data

Historical data from Reddit comments and submissions. Sample data:

Comments:

```json
{
    "all_awardings":[],
    "associated_award":null,
    "author":"<AUTHOR-NAME>",
    "author_created_utc":null,
    "author_flair_background_color":null,
    "author_flair_css_class":"new",
    "author_flair_richtext":[],
    "author_flair_template_id":"35da6d7a-6c3d-11e9-80ad-0afb553d4ea6",
    "author_flair_text":"New User",
    "author_flair_text_color":"dark",
    "author_flair_type":"text",
    "author_fullname":"<AUTHOR-FULLNAME>",
    "author_patreon_flair":false,
    "author_premium":false,
    "awarders":[],
    "body":"<COMMENT-BODY>",
    "can_gild":true,
    "can_mod_post":false,
    "collapsed":false,
    "collapsed_because_crowd_control":null,
    "collapsed_reason":null,
    "controversiality":0,
    "created_utc":1577836827,
    "distinguished":null,
    "edited":false,
    "gilded":0,
    "gildings":[],
    "id":"<COMMENT-ID>",
    "is_submitter":false,
    "link_id":"<SUBMISSION-ID>",
    "locked":false,
    "no_follow":true,
    "parent_id":"<SUBMISSION-ID>",
    "permalink":"/r/<SUBREDDIT-NAME>/.../",
    "quarantined":false,
    "removal_reason":null,
    "retrieved_on":1586450302,
    "score":1,
    "send_replies":true,
    "stickied":false,
    "subreddit":"<SUBREDDIT-NAME>",
    "subreddit_id":"<SUBREDDIT-ID>",
    "subreddit_name_prefixed":"r/<SUBREDDIT-NAME>",
    "subreddit_type":"public",
    "total_awards_received":0,
    "treatment_tags":[]
}
```

Submissions:

```json
{

    "all_awardings":[],
    "allow_live_comments":false,
    "archived":false,
    "author":"<AUTHOR-NAME>",
    "author_created_utc":1323037935,
    "author_flair_background_color":"#ea0027",
    "author_flair_css_class":null,
    "author_flair_richtext":[],
    "author_flair_template_id":"75e3132a-4c5e-11ea-b0a2-0ebabfbc47e3",
    "author_flair_text":"Warlord",
    "author_flair_text_color":"dark",
    "author_flair_type":"text",
    "author_fullname":"<AUTHOR-FULLNAME>",
    "author_patreon_flair":false,
    "author_premium":true,
    "awarders":[],
    "can_gild":true,
    "can_mod_post":false,
    "category":null,
    "content_categories":null,
    "contest_mode":false,
    "created_utc":1577836811,
    "discussion_type":null,
    "distinguished":null,
    "domain":"<DOMAIN>",
    "edited":false,
    "gilded":0,
    "gildings":[],
    "hidden":false,
    "id":"<SUBMISSION-ID>",
    "is_crosspostable":true,
    "is_meta":false,
    "is_original_content":false,
    "is_reddit_media_domain":true,
    "is_robot_indexable":true,
    "is_self":false,
    "is_video":false,
    "link_flair_background_color":"#ea0027",
    "link_flair_css_class":"",
    "link_flair_richtext":[],
    "link_flair_template_id":"5de50204-b14c-11e9-ad08-0e16aa31fd42",
    "link_flair_text":"Radar Plane",
    "link_flair_text_color":"dark",
    "link_flair_type":"text",
    "locked":false,
    "media":null,
    "media_embed":[],
    "media_only":false,
    "no_follow":false,
    "num_comments":0,
    "num_crossposts":0,
    "over_18":false,
    "parent_whitelist_status":"some_ads",
    "permalink":"/r/<SUBREDDIT-NAME>/.../",
    "pinned":false,
    "post_hint":"image",
    "preview":{
        "enabled":true,
        "images":[
            {
                "id":"<IMAGE-ID>>",
                "resolutions":[
                    {
                        "height":62,
                        "url":"...",
                        "width":108
                    },
                    ...
                ],
                "source":{
                    "height":689,
                    "url":"...",
                    "width":1200
                },
                "variants":{}
            }
        ]
    },
    "pwls":7,
    "quarantine":false,
    "removal_reason":null,
    "removed_by":null,
    "removed_by_category":null,
    "retrieved_on":1586941619,
    "score":35,
    "secure_media":null,
    "secure_media_embed":[],
    "selftext":"",
    "send_replies":true,
    "spoiler":false,
    "stickied":false,
    "subreddit":"<SUBREDDIT-NAME>",
    "subreddit_id":"<SUBREDDIT-ID>",
    "subreddit_name_prefixed":"r/<SUBREDDIT-NAME>",
    "subreddit_subscribers":19356,
    "subreddit_type":"public",
    "suggested_sort":null,
    "thumbnail":"...",
    "thumbnail_height":80,
    "thumbnail_width":140,
    "title":"<SUBMISSION-TITLE>>",
    "total_awards_received":0,
    "treatment_tags":[],
    "url":"...",

}
```

For the processing, this data was organized in separated files for year and month, 
one for comments and other for submissions, due to data size.

### 1. Load interactions step

Load comments and submissions, and transform them into interactions and subreddits storage files:

#### Interactions

Location: `storage/interactions/<date>/interactions_*.parquet`


Columns:

| column        | type   | description |
|---------------|--------|-------------|
| subreddit_id  | string | Reddit subreddit identifier |
| author_hash   | string | SHA256 anonymized user id |
| type          | string | S=submission, C=comment |

Notes:
- Only public subreddits are included
- Deleted authors are removed
- Author names are anonymized using salted SHA-256 hashes. Can't be reverted without the original salt. 

#### Subreddits

Location: `storage/subreddits/<date>/subreddits.parquet`

Columns:

| column            | type   | description |
|-------------------|--------|-------------|
| subreddit_id      | string | Reddit subreddit id |
| subreddit_name    | string | Human-readable subreddit name |
| interaction_count | int64  | Number of collected interactions |

Expect comments to be on `sources/comments/RC_<YEAR>-<MONTH>.zst` and submissions on `sources/submissions/RS_<YEAR>-<MONTH>.zst`

### 2. User interactions step

Reduces users interactions into a link between user and subreddit, counting how many interactions it had.

For future work, submissions and comments can be split in different columns to be weighted differently.

#### User interactions

Location: `storage/users/<date>/users_<batch_num>.parquet`

Columns

| column        | type   | description |
|--------------|--------|-------------|
| subreddit_id | string | Unique identifier of the subreddit |
| author_hash  | string | Salted SHA-256 hash of the Reddit username |
| comment_count | int64  | Number of comments by the user |
| submission_count | int64  | Number of submissions by the user |

Notes:
- Processed in batches due to memory capacity limitations

### 3. Subreddit relations step

Creates links between subreddits. 2 subreddits are linked if they share at least `MIN_SHARED_USERS`.
An user is considered in a subreddit as long as it has at least `MIN_INTERACTIONS` interactions.

* `MIN_SHARED_USERS` = 100
* `MIN_INTERACTIONS` = 10

For future work, explore different values for `MIN_SHARED_USERS` and `MIN_INTERACTIONS`.

#### Relations

Location: `storage/relations/<date>/relations.parquet`

Columns:

| column          | type  | description |
|-----------------|-------|-------------|
| subreddit_id_a  | string | First subreddit |
| subreddit_id_b  | string | Second subreddit |
| shared_users    | int64  | Shared anonymized users |

## How to run

### Env setup

Create the venv:

```sh
python3 -m venv venv
```

Activate it:

```sh
source .venv/bin/activate
```

Install the requirements:

```sh
pip install -r requirements.txt
```

### Local env vars

Create a `.env` file with:

```
SALT=<USER-HASH-SALT>
```

Env variables descriptions:

* `SALT`: Used on user name hash. Important to guarantee that users aren't identifiable

### Data setup

The historical reddit zst data files should be placed in `sources/comments` and `sources/submissions` dirs.
The file name conventions is `RC_<YEAR>-<MONTH>.zst` for comments and `RS_<YEAR>-<MONTH>.zst` for submissions. For examples: `RC_2024-01.zst`.

### Running pipeline

```sh
make run-pipeline DATE=<YEAR>-<MONTH>
```