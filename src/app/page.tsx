'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';
import { motion, type Variants } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  Shield,
  CheckCircle2,
  ChevronRight,
  Menu,
  Sparkles,
  Zap,
  BookOpen,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';

/* ─── Animation Variants ──────────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ─── Data ────────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: MessageSquare,
    title: 'Feed & Posts',
    desc: 'Share thoughts, photos, videos, and polls with the entire campus. Stay updated with what matters.',
  },
  {
    icon: Users,
    title: 'Communities',
    desc: 'Join interest-based groups, from study clubs to intramural sports. Find your people.',
  },
  {
    icon: Briefcase,
    title: 'Jobs & Internships',
    desc: 'Exclusive opportunities from companies actively recruiting at your university.',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    desc: 'Buy and sell textbooks, dorm essentials, and more with verified students.',
  },
  {
    icon: BookOpen,
    title: 'Research Hub',
    desc: 'Collaborate on papers, share resources, and connect with mentors across departments.',
  },
  {
    icon: Globe,
    title: 'Campus Events',
    desc: 'Discover events, workshops, and hackathons happening on and around campus.',
  },
];

const stats = [
  { value: '10K+', label: 'Active Students' },
  { value: '500+', label: 'Communities' },
  { value: '1,200+', label: 'Job Listings' },
  { value: '50+', label: 'Universities' },
];

const whyJoin = [
  { icon: Shield, title: 'Verified Network', desc: 'Only accessible with a valid .edu email address.' },
  { icon: CheckCircle2, title: 'Privacy First', desc: 'Your data is never sold to third-party advertisers.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Built for speed. No bloat, no distractions.' },
  { icon: Sparkles, title: 'Always Evolving', desc: 'New features and improvements shipped every week.' },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function RootPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-h-screen bg-canvas" />;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans overflow-x-hidden selection:bg-primary/20 selection:text-ink-deep">

      {/* ── 1. STICKY NAV ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-canvas border-b border-hairline-soft w-full h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">CC</span>
            </div>
            <span className="hidden lg:block text-ink-deep font-bold text-body-md-bold tracking-tight">
              Campus Connect
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="#features" className="px-4 py-2 rounded-full text-body-sm-bold font-medium bg-canvas text-ink border border-hairline hover:bg-surface-soft transition-colors">Features</Link>
            <Link href="#communities" className="px-4 py-2 rounded-full text-body-sm-bold font-medium bg-canvas text-ink border border-hairline hover:bg-surface-soft transition-colors">Communities</Link>
            <Link href="#jobs" className="px-4 py-2 rounded-full text-body-sm-bold font-medium bg-canvas text-ink border border-hairline hover:bg-surface-soft transition-colors">Jobs</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink hover:bg-surface-soft transition-colors"
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link href="/sign-in" className="hidden md:flex px-6 py-2.5 rounded-full text-button-md text-ink-deep border-2 border-ink-deep hover:bg-surface-soft transition-colors">
            Log In
          </Link>
          <Link href="/sign-up" className="hidden sm:flex px-7 py-3 rounded-full text-button-md bg-ink text-canvas hover:bg-charcoal transition-colors">
            Sign Up
          </Link>

          <button className="md:hidden h-10 w-10 flex items-center justify-center rounded-full bg-canvas text-ink hover:bg-surface-soft transition-colors" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1">

        {/* ── 2. HERO ────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center px-base md:px-xl overflow-hidden">

          <div className="max-w-[1280px] mx-auto w-full text-center relative z-10 py-hero">
            <motion.div
              className="badge-promo-yellow mb-xl inline-flex"
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
            >
              Now in Public Beta ✨
            </motion.div>

            <motion.h1
              className="text-display-lg md:text-hero-display text-ink-deep tracking-tight max-w-4xl mx-auto mb-xl font-display"
              initial="hidden"
              animate="visible"
              custom={0.15}
              variants={fadeUp}
            >
              Your entire campus. <br className="hidden sm:block" />
              One connected platform.
            </motion.h1>

            <motion.p
              className="text-subtitle-md text-charcoal max-w-2xl mx-auto mb-xxl text-balance"
              initial="hidden"
              animate="visible"
              custom={0.3}
              variants={fadeUp}
            >
              The all-in-one platform for college students. Share updates, join communities,
              find jobs, and collaborate on research — all in one place.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-base justify-center"
              initial="hidden"
              animate="visible"
              custom={0.45}
              variants={fadeUp}
            >
              <Link href="/sign-up" className="button-primary inline-flex items-center gap-xs">
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#features" className="button-secondary">
                See how it works
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── 3. STATS BAR ───────────────────────────────────────────────────── */}
        <section className="max-w-[1280px] mx-auto py-section px-base md:px-xl">
          <div className="bg-canvas rounded-xxxl p-xxl md:p-section-sm border border-hairline-soft">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-xl">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="text-display-lg text-ink-deep font-display">{stat.value}</div>
                  <div className="text-body-sm text-steel mt-xs">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. FEATURE GRID ────────────────────────────────────────────────── */}
        <section id="features" className="max-w-[1280px] mx-auto py-hero px-base md:px-xl">
          <div className="text-center mb-section-lg">
            <motion.h2
              className="text-display-lg text-ink-deep mb-lg font-display"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Everything you need.
            </motion.h2>
            <motion.p
              className="text-heading-md text-charcoal max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Replace multiple fragmented tools with one beautifully designed platform.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="card-product-feature flex flex-col items-start hover:-translate-y-1 transition-transform duration-300 cursor-default"
                variants={cardReveal}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-xl">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-heading-sm mb-sm text-ink-deep">{feature.title}</h3>
                <p className="text-body-md text-charcoal mb-xl flex-1 text-pretty">
                  {feature.desc}
                </p>
                <Link
                  href="/sign-up"
                  className="text-link-md text-primary hover:underline flex items-center gap-xs"
                >
                  Learn more <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── 5. WHY JOIN ────────────────────────────────────────────────────── */}
        <section className="max-w-[1280px] mx-auto py-hero px-base md:px-xl">
          <motion.h2
            className="text-heading-lg text-ink-deep text-center mb-section font-display"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Why join Campus Connect
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-xl"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {whyJoin.map((item) => (
              <motion.div
                key={item.title}
                className="why-buy-tile text-center items-center hover:bg-surface-soft transition-colors cursor-default"
                variants={cardReveal}
              >
                <item.icon className="w-10 h-10 text-primary mb-sm" strokeWidth={1.5} />
                <h3 className="text-subtitle-lg text-ink-deep">{item.title}</h3>
                <p className="text-body-sm text-charcoal">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── 6. CTA STRIP ───────────────────────────────────────────────────── */}
        <section className="max-w-[1280px] mx-auto px-base md:px-xl mb-hero">
          <motion.div
            className="card-promo-strip flex flex-col md:flex-row items-center justify-between gap-xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-xl">
              <h2 className="text-display-lg mb-md text-canvas font-display">Ready to dive in?</h2>
              <p className="text-subtitle-md text-canvas/80">
                Join thousands of students already connecting on the fastest growing campus platform.
                Get early access today.
              </p>
            </div>
            <div className="shrink-0">
              <Link href="/sign-up" className="button-buy-cta">
                Create free account
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      {/* ── 7. FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-canvas border-t border-hairline-soft pt-section pb-xl px-base md:px-xxl text-body-sm text-steel">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-xl mb-section">
          <div>
            <h4 className="text-body-sm-bold text-ink mb-md">Platform</h4>
            <ul className="flex flex-col gap-sm">
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Feed</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Communities</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Jobs</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Marketplace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-body-sm-bold text-ink mb-md">Company</h4>
            <ul className="flex flex-col gap-sm">
              <li><Link href="#" className="hover:text-ink-deep transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Press</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-body-sm-bold text-ink mb-md">Support</h4>
            <ul className="flex flex-col gap-sm">
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Safety</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Community Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-body-sm-bold text-ink mb-md">Legal</h4>
            <ul className="flex flex-col gap-sm">
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-ink-deep transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center pt-xl border-t border-hairline-soft gap-md">
          <div className="text-caption">© 2026 Campus Connect Inc.</div>
          <div className="text-caption flex gap-lg">
            <Link href="#" className="hover:text-ink-deep">English (US)</Link>
            <Link href="#" className="hover:text-ink-deep">Accessibility</Link>
          </div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
}
