'use client';

import { useUser } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlobalNav } from '@/components/navigation/GlobalNav';
import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';
import {
  MessageSquare,
  Users,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  Shield,
  Search,
  CheckCircle2,
  Menu,
  ChevronRight
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function RootPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isLoaded && isSignedIn) {
      router.push('/feed');
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded || !mounted) return <div className="min-h-screen bg-canvas" />;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans pb-16 md:pb-0 overflow-x-hidden selection:bg-primary/20 selection:text-ink-deep">
      
      {/* 1. PROMO BANNER */}
      <div className="promo-banner">
        <span>Get early access to Campus Connect v2.0 and unlock exclusive community features.</span>
        <Link href="/sign-up" className="underline underline-offset-4 hover:text-canvas/80 transition-colors">
          Join the beta today
        </Link>
      </div>

      {/* 2. TOP NAVIGATION */}
      <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-hairline-soft w-full h-[64px] flex items-center justify-between px-xl">
        <div className="flex items-center gap-section">
          {/* Logo */}
          <Link href="/" className="text-body-md-bold text-ink-deep">
            CampusConnect
          </Link>

          {/* Pill-tab Nav (Desktop) */}
          <nav className="hidden md:flex items-center gap-xs">
            <Link href="#features" className="button-pill-tab-active">
              Features
            </Link>
            <Link href="#communities" className="button-pill-tab">
              Communities
            </Link>
            <Link href="#jobs" className="button-pill-tab">
              Jobs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-md">
          {/* Theme Toggle / Search */}
          <div className="hidden md:flex relative">
            <Search className="w-4 h-4 absolute left-md top-1/2 -translate-y-1/2 text-steel" />
            <input 
              type="text" 
              placeholder="Search campus..." 
              className="search-pill pl-[36px] w-[240px]"
            />
          </div>
          
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden md:flex button-pill-tab"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <Link href="/sign-in" className="hidden md:flex button-ghost">
            Log in
          </Link>
          <Link href="/sign-up" className="hidden md:flex button-buy-cta py-[10px] px-[20px]">
            Sign up
          </Link>

          {/* Mobile Hamburger */}
          <button className="md:hidden p-xs text-ink-deep">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] mx-auto w-full">
        {/* 3. HERO BAND MARKETING */}
        <section className="mt-section-sm px-base md:px-xl mb-hero">
          <div className="card-feature-photo relative w-full h-[70vh] min-h-[600px] flex flex-col justify-end">
            {/* Background Image / Texture */}
            <div className="absolute inset-0 bg-surface-soft dark:bg-surface-soft flex items-center justify-center overflow-hidden">
               {/* Abstract placeholder for product photography */}
               <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[radial-gradient(circle_at_50%_120%,var(--primary),transparent_70%)]" />
               <div className="absolute inset-0 bg-gradient-to-t from-ink-deep/90 via-ink-deep/20 to-transparent" />
            </div>

            {/* Overlaid Copy */}
            <div className="relative z-10 p-section-lg w-full max-w-4xl text-canvas">
              <div className="badge-promo-yellow mb-lg">
                Now in Public Beta
              </div>
              <h1 className="text-hero-display mb-xl tracking-tight text-canvas">
                Your entire campus. <br/> Built for students.
              </h1>
              <p className="text-subtitle-md text-canvas/90 max-w-2xl mb-xxl text-balance">
                The all-in-one platform for college students. Share updates, join communities, find jobs, and collaborate on research seamlessly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-base">
                <Link href="/sign-up" className="button-primary text-center">
                  Join your campus
                </Link>
                <Link href="#features" className="button-secondary border-canvas text-canvas hover:bg-canvas/10 text-center">
                  Explore features
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. THREE-UP FEATURE GRIDS */}
        <section id="features" className="px-base md:px-xl mb-hero">
          <div className="text-center mb-section-lg">
            <h2 className="text-display-lg text-ink-deep mb-lg">Everything you need.</h2>
            <p className="text-heading-md text-ink max-w-3xl mx-auto">
              Replace multiple fragmented tools with one beautifully designed platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
            {/* Feature Card 1 */}
            <div className="card-product-feature flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
               <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-ink-deep mb-xl">
                 <MessageSquare className="w-6 h-6" />
               </div>
               <h3 className="text-heading-sm mb-sm text-ink-deep">Feed & Posts</h3>
               <p className="text-body-md text-ink mb-xl flex-1 text-pretty">
                 Share thoughts, photos, videos, and polls with the entire campus instantly. Stay updated with what's happening around you.
               </p>
               <Link href="/sign-up" className="text-link-md text-meta-link hover:underline flex items-center gap-xs">
                 Learn more <ChevronRight className="w-4 h-4" />
               </Link>
            </div>

            {/* Feature Card 2 */}
            <div className="card-product-feature flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
               <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-ink-deep mb-xl">
                 <Users className="w-6 h-6" />
               </div>
               <h3 className="text-heading-sm mb-sm text-ink-deep">Communities</h3>
               <p className="text-body-md text-ink mb-xl flex-1 text-pretty">
                 Join interest-based groups, from study clubs to intramural sports. Find your people and collaborate on group projects.
               </p>
               <Link href="/sign-up" className="text-link-md text-meta-link hover:underline flex items-center gap-xs">
                 Explore communities <ChevronRight className="w-4 h-4" />
               </Link>
            </div>

            {/* Feature Card 3 */}
            <div className="card-product-feature flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
               <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-ink-deep mb-xl">
                 <Briefcase className="w-6 h-6" />
               </div>
               <h3 className="text-heading-sm mb-sm text-ink-deep">Jobs & Internships</h3>
               <p className="text-body-md text-ink mb-xl flex-1 text-pretty">
                 Exclusive opportunities from top companies actively recruiting students from your university.
               </p>
               <Link href="/sign-up" className="text-link-md text-meta-link hover:underline flex items-center gap-xs">
                 View job board <ChevronRight className="w-4 h-4" />
               </Link>
            </div>
          </div>
        </section>

        {/* 5. WHY BUY TILES (Reassurance) */}
        <section className="px-base md:px-xl mb-hero">
          <div className="text-center mb-section">
            <h2 className="text-heading-lg text-ink-deep mb-md">Why join Campus Connect</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-xl">
            {[
              { title: "Verified Network", desc: "Only accessible with a valid .edu email address.", icon: Shield },
              { title: "Privacy First", desc: "Your data is never sold to third party advertisers.", icon: CheckCircle2 },
              { title: "Safe Marketplace", desc: "Buy and sell securely with fellow verified students.", icon: ShoppingBag },
              { title: "Campus News", desc: "Get official updates directly from university admin.", icon: MessageSquare }
            ].map((feature, i) => (
              <div key={i} className="why-buy-tile text-center items-center hover:bg-surface-soft transition-colors cursor-default">
                <feature.icon className="w-8 h-8 text-ink-deep mb-sm" strokeWidth={1.5} />
                <h3 className="text-subtitle-lg text-ink-deep">{feature.title}</h3>
                <p className="text-body-sm text-ink">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. PROMO STRIP CTA */}
        <section className="px-base md:px-xl mb-hero">
          <div className="card-promo-strip flex flex-col md:flex-row items-center justify-between gap-xl">
             <div className="max-w-xl">
                <h2 className="text-display-lg mb-md text-canvas">Ready to dive in?</h2>
                <p className="text-subtitle-md text-canvas/80">
                  Join thousands of students already connecting on the fastest growing campus platform. 
                  Get early access today.
                </p>
             </div>
             <div className="shrink-0 flex flex-col sm:flex-row gap-base">
                <Link href="/sign-up" className="button-buy-cta">
                  Create free account
                </Link>
             </div>
          </div>
        </section>

      </main>

      {/* 7. FOOTER REGION */}
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
