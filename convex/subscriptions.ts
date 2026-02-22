import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
