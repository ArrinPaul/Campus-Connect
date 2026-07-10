'use client';

import { useUser } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { GlobalNav } from '@/components/navigation/GlobalNav';
import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';
import {
  MessageSquare,
  Users,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Feed & Posts',
    description: 'Share your thoughts, photos, videos, and polls with the campus.',
  },
  {
    icon: Users,
    title: 'Communities',
    description: 'Join interest-based groups — from study clubs to intramural sports.',
  },
  {
    icon: Briefcase,
    title: 'Jobs & Internships',
    description: 'Discover exclusive opportunities from top companies actively recruiting.',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy and sell textbooks, gear, electronics, and more with fellow students.',
  },
];

export default function RootPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/feed');
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="animate-pulse text-ink opacity-50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col pb-16 md:pb-0">
      {/* Promo banner: Sticky full-width promotional strip ABOVE the top nav */}
      <div className="w-full bg-ink-deep text-canvas text-body-sm-bold py-md px-xl flex items-center justify-center gap-2">
        <span>Get early access to the #1 academic collaboration platform.</span>
        <Link href="/sign-up" className="underline hover:text-white transition-colors">Join the beta today</Link>
      </div>

      <GlobalNav />

      <main className="flex-1 overflow-x-hidden">
        {/* hero-band-marketing */}
        <section className="w-full relative py-hero px-4 md:px-8 flex flex-col items-center overflow-hidden bg-ink-deep rounded-b-xxxl mx-auto max-w-[1920px]">
          {/* Subtle photographic background placeholder via CSS or image */}
          <div className="absolute inset-0 bg-gradient-to-br from-ink-deep via-charcoal to-ink-deep opacity-80" />
          
          <div className="relative z-10 max-w-[1280px] w-full flex flex-col items-center text-center">
            <h1 className="text-hero-display text-canvas max-w-4xl mb-6">
              Connect. Collaborate. Campus.
            </h1>
            <p className="text-subtitle-md text-canvas/80 max-w-2xl mb-12">
              The all-in-one platform for college students — share updates, join communities, find jobs, and collaborate on research. Built by students, for students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/sign-up"
                className="px-[30px] py-[14px] bg-canvas text-ink-deep rounded-full text-button-md hover:bg-surface-soft transition-colors flex items-center gap-2"
              >
                Get Started
              </Link>
              <Link
                href="#features"
                className="px-[28px] py-[12px] bg-transparent text-canvas rounded-full text-button-md border-2 border-canvas hover:bg-canvas/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Showcase: card-product-feature style */}
        <section id="features" className="w-full py-section-lg px-4 md:px-8 max-w-[1280px] mx-auto">
          <div className="mb-section flex flex-col items-center text-center">
            <h2 className="text-display-lg text-ink-deep mb-4">
              Everything you need.
            </h2>
            <p className="text-subtitle-md text-ink max-w-2xl">
              One platform to replace them all. From daily campus life to career opportunities — Campus Connect has you covered.
            </p>
          </div>

          {/* card-icon-feature row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-canvas rounded-xl p-xl border border-hairline-soft text-left flex flex-col"
                >
                  <Icon className="w-8 h-8 text-ink-deep mb-6" strokeWidth={1.5} />
                  <h3 className="text-subtitle-lg text-ink-deep mb-2">{feature.title}</h3>
                  <p className="text-body-sm text-steel leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Buy Tile / Reassurance Row */}
        <section className="w-full bg-surface-soft py-section-lg px-4 md:px-8">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-canvas rounded-xxxl p-xxxl flex flex-col justify-center shadow-sm">
              <h3 className="text-heading-lg text-ink-deep mb-4">Built for prescriptions.</h3>
              <p className="text-body-md text-charcoal mb-8">
                Connect with verified students from your university. No spam, no external noise. Pure campus life.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex w-fit px-[30px] py-[14px] bg-ink-button text-on-ink-button rounded-full text-button-md hover:bg-charcoal transition-colors"
              >
                Join your campus
              </Link>
            </div>
            
            <div className="bg-canvas rounded-xxxl p-xxxl flex flex-col justify-center shadow-sm">
              <h3 className="text-heading-lg text-ink-deep mb-4">Worry-free collaboration.</h3>
              <p className="text-body-md text-charcoal mb-8">
                Share research papers, find study groups, and get the help you need when you need it.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex w-fit px-[30px] py-[14px] bg-ink-button text-on-ink-button rounded-full text-button-md hover:bg-charcoal transition-colors"
              >
                Start collaborating
              </Link>
            </div>
          </div>
        </section>

        {/* card-promo-strip */}
        <section className="w-full max-w-[1280px] mx-auto py-section px-4 md:px-8">
          <div className="bg-ink-deep text-canvas rounded-xxxl p-section flex flex-col items-center text-center">
            <Sparkles className="w-12 h-12 text-warning mb-6" />
            <h2 className="text-heading-lg md:text-display-lg text-canvas mb-4">
              Join the campus revolution.
            </h2>
            <p className="text-subtitle-md text-canvas/80 max-w-xl mb-10">
              Connect with your academic community today. It&apos;s free, fast, and built for the way you actually use campus life.
            </p>
            <Link
              href="/sign-up"
              className="px-[30px] py-[14px] bg-canvas text-ink-deep rounded-full text-button-md hover:bg-surface-soft transition-colors flex items-center gap-2"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      
      <MobileBottomNav />
    </div>
  );
}
