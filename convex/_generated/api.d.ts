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
import type * as comments from "../comments.js";
import type * as follows from "../follows.js";
import type * as hashtags from "../hashtags.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as reactions from "../reactions.js";
import type * as sanitize from "../sanitize.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bookmarks: typeof bookmarks;
  comments: typeof comments;
  follows: typeof follows;
  hashtags: typeof hashtags;
  http: typeof http;
  notifications: typeof notifications;
  posts: typeof posts;
  reactions: typeof reactions;
  sanitize: typeof sanitize;
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
