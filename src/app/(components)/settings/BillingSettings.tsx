'use client';

import { useQuery } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  CreditCard,
  Crown,
  CheckCircle,
  ArrowUpCircle,
  Loader2,
  Zap,
  Search,
  BarChart3,
  FileText,
  Headphones,
  BadgeCheck,
  Sparkles,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';

const PRO_FEATURES = [
  { icon: Search, label: 'Advanced Search', description: 'Full-text and fuzzy search across all content.' },
  { icon: BarChart3, label: 'Profile Analytics', description: 'Detailed insights into profile views and engagement.' },
  { icon: FileText, label: 'Unlimited Posts', description: 'Post without daily limits.' },
  { icon: Headphones, label: 'Priority Support', description: 'Get help faster with dedicated support.' },
  { icon: BadgeCheck, label: 'Pro Badge', description: 'Stand out with an exclusive Pro badge on your profile.' },
  { icon: Sparkles, label: 'Early Access', description: 'Be the first to try new features.' },
];

export function BillingSettings() {
  const { isAuthenticated } = useConvexAuth();
  const subscription = useQuery(api.subscriptions.getMySubscription, isAuthenticated ? undefined : 'skip');

  if (subscription === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const isPro = subscription?.isPro ?? false;
  const plan = subscription?.plan ?? 'free';
  const status = subscription?.status;
  const periodEnd = subscription?.currentPeriodEnd;
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <CreditCard className="w-6 h-6 text-blue-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Billing & Subscription</h2>
          <p className="text-sm text-zinc-400">Manage your plan and payment details</p>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className={`rounded-xl border p-6 ${
        isPro ? 'bg-gradient-to-br from-yellow-900/20 to-amber-900/10 border-yellow-800/50' : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isPro ? (
              <Crown className="w-8 h-8 text-yellow-400" />
            ) : (
              <Zap className="w-8 h-8 text-zinc-400" />
            )}
            <div>
              <h3 className="text-lg font-bold text-white">
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </h3>
              <p className="text-sm text-zinc-400">
                {isPro ? 'You have access to all premium features' : 'Basic access to ClusterDelta'}
              </p>
            </div>
          </div>
          {isPro && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full uppercase tracking-wide">
              Active
            </span>
          )}
        </div>

        {/* Status details for Pro users */}
        {isPro && status && (
          <div className="space-y-2 mb-4 pl-11">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <CalendarClock className="w-4 h-4 text-zinc-500" />
              <span>
                {periodEnd
                  ? `Current period ends: ${new Date(periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : 'Subscription active'}
              </span>
            </div>
            {cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Cancellation scheduled — access continues until period end</span>
              </div>
            )}
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {!isPro && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <ArrowUpCircle className="w-5 h-5" />
              Upgrade to Pro — $9.99/mo
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700">
              Yearly — $79.99/yr
              <span className="text-xs text-green-400 ml-1">Save 33%</span>
            </button>
          </div>
        )}

        {/* Management for Pro users */}
        {isPro && !cancelAtPeriodEnd && (
          <div className="mt-4 pl-11">
            <button className="text-sm text-zinc-400 hover:text-red-400 transition-colors">
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      {/* Pro Features */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {isPro ? 'Your Pro Features' : 'What you get with Pro'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRO_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  isPro
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-zinc-900/50 border-zinc-800/50'
                }`}
              >
                <div className={`mt-0.5 p-2 rounded-lg ${isPro ? 'bg-blue-500/10' : 'bg-zinc-800'}`}>
                  <Icon className={`w-4 h-4 ${isPro ? 'text-blue-400' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{feature.label}</span>
                    {isPro && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-medium text-white mb-3">Billing History</h3>
        {isPro ? (
          <div className="text-sm text-zinc-400">
            <p>Billing history is managed through Stripe. Click below to view your invoices.</p>
            <button className="mt-3 px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors border border-zinc-700">
              View Invoices in Stripe
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No billing history — you&apos;re on the free plan.</p>
        )}
      </div>

      {/* Payment Method */}
      {isPro && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-medium text-white mb-3">Payment Method</h3>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <CreditCard className="w-5 h-5 text-zinc-500" />
            <span>Payment method managed through Stripe</span>
          </div>
          <button className="mt-3 px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors border border-zinc-700">
            Update Payment Method
          </button>
        </div>
      )}
    </div>
  );
}