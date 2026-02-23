import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ────────────────────────────────────────────
// Pricing & feature constants (exported for tests and UI)
// ────────────────────────────────────────────

export const PRICING = {
  monthly: { amount: 999, interval: "month", label: "$9.99 / month" },
  yearly:  { amount: 7999, interval: "year",  label: "$79.99 / year"  },
} as const;

export const PRO_FEATURES: Array<{ key: string; label: string; description: string }> = [
  { key: "advanced_search",    label: "Advanced Search",    description: "Full-text and fuzzy search across all content." },
  { key: "profile_analytics",  label: "Profile Analytics",  description: "Detailed insights into profile views and engagement." },
  { key: "unlimited_posts",    label: "Unlimited Posts",    description: "Post without daily limits." },
  { key: "priority_support",   label: "Priority Support",   description: "Get help faster with dedicated support." },
  { key: "custom_badge",       label: "Pro Badge",           description: "Stand out with an exclusive Pro badge on your profile." },
  { key: "early_access",       label: "Early Access",        description: "Be the first to try new features." },
];

export const createSubscription = internalMutation({
    args: {
        userId: v.id("users"),
        stripeSubscriptionId: v.string(),
        stripeCustomerId: v.string(),
        plan: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found for subscription");
        }

        await ctx.db.insert("subscriptions", {
            userId: args.userId,
            stripeSubscriptionId: args.stripeSubscriptionId,
            stripeCustomerId: args.stripeCustomerId,
            plan: args.plan as any,
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.patch(user._id, {
            isPro: true,
            stripeCustomerId: args.stripeCustomerId,
        });
    }
});

export const updateSubscriptionStatus = internalMutation({
    args: {
        stripeSubscriptionId: v.string(),
        status: v.string(),
        plan: v.string(),
        cancelAtPeriodEnd: v.boolean(),
        currentPeriodEnd: v.number(),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_stripe_sub", q => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
            .unique();

        if (!subscription) {
            throw new Error("Subscription not found");
        }

        await ctx.db.patch(subscription._id, {
            status: args.status as any,
            plan: args.plan as any,
            cancelAtPeriodEnd: args.cancelAtPeriodEnd,
            currentPeriodEnd: args.currentPeriodEnd,
            updatedAt: Date.now(),
        });

        const isPro = args.status === 'active' || args.status === 'trialing';

        const user = await ctx.db.get(subscription.userId);
        if(user && user.isPro !== isPro) {
            await ctx.db.patch(user._id, { isPro });
        }
    }
});
