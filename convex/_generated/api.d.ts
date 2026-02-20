/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bookmarks from "../bookmarks.js";
import type * as calls from "../calls.js";
import type * as comments from "../comments.js";
import type * as communities from "../communities.js";
import type * as conversations from "../conversations.js";
import type * as feedRanking from "../feed-ranking.js";
import type * as follows from "../follows.js";
import type * as matching from "../matching.js";
import type * as hashtags from "../hashtags.js";
import type * as http from "../http.js";
import type * as media from "../media.js";
import type * as mentionUtils from "../mentionUtils.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as polls from "../polls.js";
import type * as presence from "../presence.js";
import type * as reactions from "../reactions.js";
import type * as recommendations from "../recommendations.js";
import type * as reposts from "../reposts.js";
import type * as sanitize from "../sanitize.js";
import type * as search from "../search.js";
import type * as skillEndorsements from "../skill-endorsements.js";
import type * as stories from "../stories.js";
import type * as suggestions from "../suggestions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bookmarks: typeof bookmarks;
  calls: typeof calls;
  comments: typeof comments;
  communities: typeof communities;
  conversations: typeof conversations;
  feedRanking: typeof feedRanking;
  follows: typeof follows;
  matching: typeof matching;
  hashtags: typeof hashtags;
  http: typeof http;
  media: typeof media;
  mentionUtils: typeof mentionUtils;
  messages: typeof messages;
  notifications: typeof notifications;
  posts: typeof posts;
  polls: typeof polls;
  presence: typeof presence;
  reactions: typeof reactions;
  recommendations: typeof recommendations;
  reposts: typeof reposts;
  sanitize: typeof sanitize;
  search: typeof search;
  skillEndorsements: typeof skillEndorsements;
  stories: typeof stories;
  suggestions: typeof suggestions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
