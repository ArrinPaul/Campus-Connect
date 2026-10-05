# Methodology

How Campus Connect decides what you see and who you meet: feed ranking, friend suggestions, study-partner matching, research search, reputation and the leaderboard, and hashtag trends. All of it runs on the server in plain TypeScript with no machine-learning model, and it is deliberately simple and explainable.

This document describes what the code does today, including places where it falls short of what its names or comments suggest.

[← Back to README](./README.md)

## Contents

1. [Overview](#1-overview)
2. [Home feed ranking](#2-home-feed-ranking)
3. [Explore feed](#3-explore-feed)
4. [People suggestions](#4-people-suggestions)
5. [Study-partner matching](#5-study-partner-matching)
6. [Research search](#6-research-search)
7. [Reputation, levels and badges](#7-reputation-levels-and-badges)
8. [Leaderboard](#8-leaderboard)
9. [Trending hashtags](#9-trending-hashtags)
10. [Known limitations](#10-known-limitations)

---

## 1. Overview

| Feature | Where | Technique |
| :--- | :--- | :--- |
| Home feed | `src/server/db/posts.ts` (`getFeedPosts`) | Affinity × engagement × time decay |
| Explore | `src/server/db/posts.ts` (`getExplorePosts`) | Sorted by like count |
| People suggestions | `src/app/api/graph/suggestions/route.ts` | Additive point score |
| Partner matching | `src/server/recommendations/matching-engine.ts` | Weighted Jaccard overlap |
| Research search | `src/server/recommendations/matching-engine.ts` | Cosine similarity, keyword fallback |
| Reputation | `src/server/db/gamification.ts` | Event points, level, rule-based badges |
| Leaderboard | `src/server/db/gamification.ts` | Sum of points, deterministic sort |
| Trending hashtags | `src/server/db/hashtags.ts` | Sorted by post count |

Ranking happens in application memory after a database query returns a candidate pool, not in SQL.

## 2. Home feed ranking

The feed is a "Hacker News with a social boost" style score. For a viewer $u$ and a post $p$:

$$\text{score}(p) = \underbrace{a(p)}_{\text{affinity}}\ \cdot\ \underbrace{\bigl(1 + \log_{10}(1 + w(p))\bigr)}_{\text{engagement}}\ \cdot\ \underbrace{\frac{1}{(h(p) + 2)^{1.5}}}_{\text{time decay}}$$

**Affinity** $a(p)$ depends on who wrote the post:

| Author | $a$ |
| :--- | :---: |
| Someone you follow | 2.0 |
| You | 1.5 |
| Anyone else | 1.0 |

**Engagement** weights shares most, then comments, then likes:

$$w(p) = \text{likes} + 2\cdot\text{comments} + 3\cdot\text{shares}$$

The logarithm stops a very popular post from dominating, so ten times the engagement adds only about one point to the multiplier.

**Time decay** uses the post's age $h$ in hours. The $+2$ keeps brand-new posts from blowing up and the exponent 1.5 makes old posts fade quickly:

| Age $h$ | Decay $1/(h+2)^{1.5}$ |
| :---: | :---: |
| 0 h | 0.354 |
| 1 h | 0.193 |
| 6 h | 0.044 |
| 24 h | 0.0075 |
| 72 h | 0.0016 |

**Candidate pool.** The server loads the most recent $\max(100,\ \text{offset} + 2\cdot\text{limit})$ posts, scores them all, sorts by score and returns the requested page of that ranked list.

**Worked example.**

| Post | Affinity | Engagement | Age | Score |
| :--- | :---: | :--- | :---: | :---: |
| A: stranger, no engagement | 1.0 | 0 | 1 h | **0.193** |
| B: followed author, 10 likes, 3 comments, 1 share | 2.0 | $w = 19$ | 24 h | **0.035** |
| C: stranger, 500 likes, 50 comments, 20 shares | 1.0 | $w = 660$ | 24 h | **0.029** |

Post A, with no engagement at all, outranks B and C. Recency dominates this formula: once a post is about a day old it needs a huge amount of engagement to compete with a fresh one. The feed behaves more like a "newest from a recent pool" list with mild social and popularity nudges than a true engagement ranker.

## 3. Explore feed

Explore ignores affinity and time. It returns posts ordered by `like_count`, highest first, with simple pagination. Old, heavily liked posts therefore stay at the top indefinitely.

## 4. People suggestions

`GET /api/graph/suggestions` scores people you don't follow and returns the top few (default 5). Points add up:

| Signal | Points |
| :--- | :--- |
| Each mutual connection (someone you follow also follows them) | +30 |
| Same university | +50 |
| Each shared skill | +20 |
| Each shared community | +15 |
| Popularity | $+\min\bigl(20,\ \lfloor 0.1 \times \text{followers} \rfloor\bigr)$ |

$$\text{score} = 30\,m + 50\,[\text{same university}] + 20\,k + 15\,c + \min(20, \lfloor 0.1 f \rfloor)$$

where $m$ is mutual connections, $k$ shared skills, $c$ shared communities and $f$ the follower count. Each suggestion carries human-readable reasons such as "2 mutual connections" or "Studies at X". With no signals the reason is "Popular on Campus Connect".

How candidates are chosen: the server takes up to **200** users you don't follow, in whatever order the database returns them, and scores only those. Mutual connections are counted as the number of follow edges from the people you follow to the candidate. Skills are matched by exact text, case-sensitively.

## 5. Study-partner matching

`GET /api/matching` recommends study buddies and project partners, and `GET /api/matching/score` gives the compatibility of two specific users. The score is a weighted sum, scaled so the maximum is exactly 100:

$$S = 35\,J_{\text{skills}} + 25\,[\text{same university}] + 20\,[\text{same department}] + 20\,J_{\text{bio}}$$

| Factor | Weight | How it is measured |
| :--- | :---: | :--- |
| Skills | 35 | Jaccard similarity of the two skill lists, case-insensitive |
| University | 25 | Same university, case-insensitive match |
| Department | 20 | Same department, case-insensitive match |
| Bio / interests | 20 | Jaccard similarity of the words longer than 3 characters in each bio |

**Jaccard similarity** of two sets $A$ and $B$ measures overlap as a fraction of everything either set contains:

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

It is 0 when nothing is shared and 1 when the sets are identical.

If every factor is 0, the score is raised to a floor of **15** with the reason "Recommended for campus networking", so nobody shows a score of zero. The result is rounded and capped at 100, and it comes with reasons like "Shared skills: python, ml" and "Both at X". The response also has a `reputationTier` field, but it is fixed at 1 and does not affect the score.

**Candidate selection.** The recommendations list takes the first **51** other users (optionally filtered to one university), scores them and sorts by score. It does not look at the whole user base.

## 6. Research search

`GET /api/research/search` is meant to combine meaning-based and keyword search.

**Meaning-based path.** The query is turned into an embedding vector. Each stored paper embedding is compared by cosine similarity, clamped to the range 0 to 1 so negative similarity counts as 0:

$$\cos(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\,\lVert\mathbf{b}\rVert}$$

Two embedding providers exist:

| Provider | Dimensions | Used when |
| :--- | :---: | :--- |
| OpenAI `text-embedding-3-small` | 1536 | `OPENAI_API_KEY` is set to a real key |
| Mock | 128 | The key is missing or starts with `mock_` |

The mock provider is a deterministic hash of character codes with no understanding of meaning. It exists so tests and local runs work offline. When it is active, the response carries a degraded-mode signal and the server logs a one-time warning.

**Keyword fallback.** If there are no embeddings, or no matching papers, the search falls back to a case-insensitive substring match on title and abstract, newest first.

**What actually happens today.** Nothing in the codebase ever writes to the `research_embeddings` table. The search reads it, finds it empty and drops to the keyword fallback every time, so in practice research search is keyword search. The embeddings are also stored as JSON arrays, not in a pgvector `vector` column, so the comparison would be done in the application over every row and not with a vector index. Making semantic search real needs three changes: generate and store an embedding when a paper is created, store them in a `vector` column with an index, and rank on the database side.

## 7. Reputation, levels and badges

Reputation points are recorded as **events**, one per rewarded action, and added to a running total.

| Action | Points |
| :--- | :---: |
| Your answer is accepted | 15 |
| Your question gets an upvote | 5 |
| Your research paper gets a vote | 10 |
| Your peer review is marked helpful | 10 |

Rules:

- **No duplicates.** An event is unique per recipient, event type and source item, so the same upvote cannot be rewarded twice.
- **No self-awards.** The recipient and the actor must differ.
- **Revocable.** Removing an upvote or vote deletes the event and subtracts its points, never below 0.

**Level** is a straight function of total points:

$$\text{level} = \left\lfloor \frac{\text{points}}{100} \right\rfloor + 1$$

so a new user is level 1 and reaches level 2 at 100 points.

**Badges** are awarded by fixed rules and are never removed:

| Badge | Awarded when |
| :--- | :--- |
| Top Researcher | Uploaded at least 1 paper, and has received a research vote or has 50 or more points |
| Helpful Peer | Has an accepted answer or a helpful peer review |
| Campus Leader | Has 100 or more points, or 5 or more skill endorsements |

Badges are re-evaluated every time points are awarded.

## 8. Leaderboard

| Period | Points counted |
| :--- | :--- |
| Weekly | Sum of reputation events from the last 7 days |
| Monthly | Sum of reputation events from the last 30 days |
| All-time | The user's total reputation points |

Users are sorted by points, highest first, with ties broken alphabetically by name. That makes ranks fully deterministic. Ranks start at 1, there is an optional university filter, and the response includes the signed-in user's own rank even if they are off the current page.

## 9. Trending hashtags

"Trending" is the hashtags with the highest total `post_count`, with no time window, so a tag that was popular years ago can stay on top. Tags are normalized to lowercase letters and digits only. Each time a post is linked to a tag, the tag's count is incremented.

## 10. Known limitations

These are real gaps in the current code. Some would change results noticeably:

- **Feed ranking is recency-heavy.** See the worked example in §2. It also ranks only a pool of recent posts, and it does not filter by visibility, blocks or communities.
- **Explore and trending are all-time.** Neither considers recency, so they favour old popular content.
- **Candidate pools are limited and unordered.** People suggestions look at 200 users and partner matching at 51, in database order. In a large user base the best match may never be considered.
- **Research search is keyword-only in practice** (§6). The OpenAI key currently has no effect on results.
- **Search results from the semantic path are not ordered by similarity.** The final lookup fetches the top papers with a plain "in this list" query, which does not preserve ranking order. This would matter once embeddings exist.
- **Reputation updates are not atomic.** Points are read, changed and written back in separate steps, so two simultaneous rewards for the same user could lose one update. The code comment calls it atomic, but it is not.
- **Weekly and monthly leaderboards lose badges and stored levels.** The query that loads each user's badges filters on the wrong column (`id` instead of `user_id`). `user_reputation` has no `id` column, so that query returns nothing. Levels are then recomputed from the period's points and badges show as empty.
- **The all-time leaderboard loads every reputation row** and paginates in memory. This is fine for a campus-sized user base but will not scale.
- **Hashtag counts are off.** A new tag is created with a count of 1 and then incremented again for the same post, so every new tag starts at 2. Counts are also updated in a separate, non-transactional step, and a duplicate link may still bump the count.
- **No personalization beyond follows and profile data.** The app does not learn from what you read or click.
- **Nothing here is validated.** There are no offline evaluations or A/B tests behind the weights. They are reasonable starting values and not tuned numbers.
