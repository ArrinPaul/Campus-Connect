import type { Doc, Id } from '@/convex/_generated/dataModel';

export type FeedItem = {
  type: "post" | "repost";
  _id: Id<"posts"> | Id<"reposts">;
  createdAt: number;
  post: Doc<"posts"> & { author: Doc<"users"> | null };
  reposter?: Doc<"users"> | null;
  quoteContent?: string | null;
};
