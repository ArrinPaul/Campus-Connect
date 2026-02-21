/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ads from "../ads.js";
import type * as bookmarks from "../bookmarks.js";
import type * as calls from "../calls.js";
import type * as comments from "../comments.js";
import type * as communities from "../communities.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as feed_ranking from "../feed_ranking.js";
import type * as follows from "../follows.js";
import type * as gamification from "../gamification.js";
import type * as hashtags from "../hashtags.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as logger from "../logger.js";
import type * as marketplace from "../marketplace.js";
import type * as matching from "../matching.js";
import type * as math_utils from "../math_utils.js";
import type * as media from "../media.js";
import type * as mentionUtils from "../mentionUtils.js";
import type * as messages from "../messages.js";
import type * as monitoring from "../monitoring.js";
import type * as notifications from "../notifications.js";
import type * as papers from "../papers.js";
import type * as polls from "../polls.js";
import type * as portfolio from "../portfolio.js";
import type * as posts from "../posts.js";
import type * as presence from "../presence.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as questions from "../questions.js";
import type * as reactions from "../reactions.js";
import type * as recommendations from "../recommendations.js";
import type * as reposts from "../reposts.js";
import type * as resources from "../resources.js";
import type * as sanitize from "../sanitize.js";
import type * as search from "../search.js";
import type * as skill_endorsements from "../skill_endorsements.js";
import type * as stories from "../stories.js";
import type * as subscriptions from "../subscriptions.js";
import type * as suggestions from "../suggestions.js";
import type * as users from "../users.js";
import type * as validation_constants from "../validation_constants.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ads: typeof ads;
  bookmarks: typeof bookmarks;
  calls: typeof calls;
  comments: typeof comments;
  communities: typeof communities;
  conversations: typeof conversations;
  crons: typeof crons;
  events: typeof events;
  feed_ranking: typeof feed_ranking;
  follows: typeof follows;
  gamification: typeof gamification;
  hashtags: typeof hashtags;
  http: typeof http;
  jobs: typeof jobs;
  logger: typeof logger;
  marketplace: typeof marketplace;
  matching: typeof matching;
  math_utils: typeof math_utils;
  media: typeof media;
  mentionUtils: typeof mentionUtils;
  messages: typeof messages;
  monitoring: typeof monitoring;
  notifications: typeof notifications;
  papers: typeof papers;
  polls: typeof polls;
  portfolio: typeof portfolio;
  posts: typeof posts;
  presence: typeof presence;
  pushNotifications: typeof pushNotifications;
  questions: typeof questions;
  reactions: typeof reactions;
  recommendations: typeof recommendations;
  reposts: typeof reposts;
  resources: typeof resources;
  sanitize: typeof sanitize;
  search: typeof search;
  skill_endorsements: typeof skill_endorsements;
  stories: typeof stories;
  subscriptions: typeof subscriptions;
  suggestions: typeof suggestions;
  users: typeof users;
  validation_constants: typeof validation_constants;
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
