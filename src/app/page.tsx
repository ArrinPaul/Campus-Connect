'use client';

import { useUser } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { GlobalNav } from '@/components/navigation/GlobalNav';
import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav';
import { motion, Variants } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Globe,
  Zap,
} from 'lucide-react';

const FADE_DOWN: Variants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', duration: 0.8 } },
};

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', duration: 1, bounce: 0.3 } },
};

export default function RootPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/feed');
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) return <div className="min-h-screen bg-canvas" />;

  return (
    <div className="min-h-screen bg-canvas flex flex-col pb-16 md:pb-0 font-sans selection:bg-primary-soft selection:text-ink-deep">
      {/* Promo banner */}
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="w-full bg-ink-deep text-canvas text-body-sm-bold py-3 px-xl flex flex-wrap items-center justify-center gap-x-4 gap-y-1 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/20 via-oculus-purple/20 to-primary-deep/20 animate-pulse" />
        <span className="relative z-10 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-warning" />
          Get early access to the #1 academic collaboration platform.
        </span>
        <Link href="/sign-up" className="relative z-10 text-primary-soft hover:text-canvas transition-colors inline-flex items-center gap-1 group">
          Join the beta today
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      <GlobalNav />

      <main className="flex-1 overflow-x-hidden">
        {/* HERO SECTION */}
        <section className="relative w-full min-h-[85vh] flex items-center justify-center px-4 overflow-hidden rounded-b-[40px] md:rounded-b-[80px] bg-ink-deep text-canvas">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
              className="absolute -top-[50%] -left-[20%] w-[100%] h-[150%] rounded-[100%] bg-gradient-to-br from-primary/20 via-oculus-purple/10 to-transparent blur-[120px] mix-blend-screen" 
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 80, ease: "linear" }}
              className="absolute top-[20%] -right-[30%] w-[80%] h-[120%] rounded-full bg-gradient-to-bl from-warning/10 via-fb-blue/10 to-transparent blur-[120px] mix-blend-screen" 
            />
            {/* Grid overlay for texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          </div>

          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.15 } }
            }}
            className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center pt-16 md:pt-0"
          >
            <motion.div variants={FADE_DOWN} className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-canvas/10 border border-canvas/20 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-success animate-ping" />
              <span className="text-caption-bold text-canvas uppercase tracking-wider">Now in Public Beta</span>
            </motion.div>
            
            <motion.h1 variants={FADE_UP} className="text-hero-display tracking-tight leading-[1.1] mb-6 drop-shadow-xl">
              Connect. Collaborate. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-soft via-oculus-purple to-warning">
                Campus.
              </span>
            </motion.h1>
            
            <motion.p variants={FADE_UP} className="text-heading-sm text-canvas/70 max-w-2xl mb-12 font-light">
              The all-in-one platform for college students. Share updates, join communities, find jobs, and collaborate on research.
            </motion.p>
            
            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto px-10 py-5 bg-primary text-canvas rounded-full text-button-md hover:bg-primary-deep hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 group"
              >
                Join your campus
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-10 py-5 bg-transparent text-canvas rounded-full text-button-md border border-canvas/30 hover:bg-canvas/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2"
              >
                Explore features
              </Link>
            </motion.div>

            {/* Mockup / Dashboard Preview */}
            <motion.div 
              variants={FADE_UP}
              className="mt-20 w-full max-w-4xl relative rounded-t-xxxl overflow-hidden border border-canvas/10 bg-canvas/5 backdrop-blur-xl shadow-2xl p-4 sm:p-8"
              style={{ transform: 'perspective(1200px) rotateX(8deg)', transformOrigin: 'top center' }}
            >
              <div className="w-full h-8 bg-ink rounded-t-xl flex items-center px-4 gap-2 border-b border-canvas/10">
                <div className="w-3 h-3 rounded-full bg-critical" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <div className="w-full h-[400px] bg-canvas/95 rounded-b-xl flex flex-col p-6 gap-6 overflow-hidden">
                <div className="flex gap-4 items-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-surface-soft animate-pulse" />
                  <div className="w-48 h-10 rounded-full bg-surface-soft animate-pulse" />
                </div>
                <div className="w-full h-40 rounded-2xl bg-surface-soft border border-hairline animate-pulse delay-75" />
                <div className="flex gap-4">
                  <div className="w-1/3 h-48 rounded-2xl bg-surface-soft border border-hairline animate-pulse delay-150" />
                  <div className="w-2/3 h-48 rounded-2xl bg-surface-soft border border-hairline animate-pulse delay-300" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="w-full py-hero px-4 md:px-8 max-w-7xl mx-auto relative">
          <div className="text-center mb-section-lg">
            <h2 className="text-display-lg text-ink-deep mb-4 tracking-tight">Everything you need.</h2>
            <p className="text-heading-sm text-steel max-w-2xl mx-auto font-light">
              One platform to replace them all. From daily campus life to career opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {[
              { icon: MessageSquare, title: 'Feed & Posts', desc: 'Share your thoughts, photos, videos, and polls with the campus.', color: 'text-fb-blue', bg: 'bg-fb-blue/10' },
              { icon: Users, title: 'Communities', desc: 'Join interest-based groups — from study clubs to intramural sports.', color: 'text-oculus-purple', bg: 'bg-oculus-purple/10' },
              { icon: Briefcase, title: 'Jobs & Internships', desc: 'Discover exclusive opportunities from top companies actively recruiting.', color: 'text-success', bg: 'bg-success/10' },
              { icon: ShoppingBag, title: 'Marketplace', desc: 'Buy and sell textbooks, gear, electronics, and more with fellow students.', color: 'text-attention', bg: 'bg-attention/10' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative bg-canvas rounded-xxxl p-xxxl border border-hairline-soft shadow-subtle hover:shadow-sticky-panel transition-all duration-300 hover:-translate-y-2 overflow-hidden cursor-default"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-heading-md text-ink-deep mb-4">{feature.title}</h3>
                <p className="text-body-md text-steel leading-relaxed">
                  {/* @ts-ignore */}
                  {feature.desc || feature.description}
                </p>
                
                <div className="absolute right-8 bottom-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-ink-deep" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* WHY BUY STRIP (Reassurance) */}
        <section className="w-full py-hero px-4 md:px-8 relative overflow-hidden bg-ink-deep text-canvas my-section">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent blur-[150px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-sm">
                <Globe className="w-4 h-4 text-primary-soft" />
                <span className="text-caption-bold text-white uppercase tracking-wider">Verified Network</span>
              </div>
              <h2 className="text-display-lg font-bold mb-6 leading-[1.1]">
                Built for <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-soft to-oculus-purple">
                  pure campus life.
                </span>
              </h2>
              <p className="text-heading-sm text-canvas/70 font-light mb-10 leading-relaxed">
                Connect with verified students from your university. No spam, no external noise. Just the people who matter right now.
              </p>
              
              <ul className="space-y-5 mb-12">
                {['Verified .edu emails only', 'Private community forums', 'Safe marketplace transactions'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-body-md-bold text-canvas/90">
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-success" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className="inline-flex px-10 py-5 bg-primary text-canvas rounded-full text-button-md hover:bg-primary-deep transition-colors items-center gap-2 group"
              >
                Join your campus
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative aspect-square w-full max-w-lg mx-auto md:max-w-none"
            >
              {/* Glassmorphic decorative card */}
              <div className="absolute inset-4 rounded-[40px] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="w-full h-full flex flex-col p-8 gap-6 opacity-40">
                   <div className="w-full h-32 rounded-3xl bg-white/10 animate-pulse" />
                   <div className="w-3/4 h-16 rounded-3xl bg-white/10 animate-pulse delay-75" />
                   <div className="w-full h-48 rounded-3xl bg-white/10 mt-auto animate-pulse delay-150" />
                </div>
                {/* Floating elements */}
                <motion.div 
                  animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="absolute top-1/4 left-1/4 w-40 h-40 bg-primary-soft rounded-full blur-[80px] opacity-60"
                />
                <motion.div 
                  animate={{ y: [0, 25, 0], x: [0, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-oculus-purple rounded-full blur-[80px] opacity-50"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* PROMO STRIP CTA */}
        <section className="w-full max-w-5xl mx-auto py-section px-4 md:px-8 mb-hero">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-surface-soft to-canvas border border-hairline-soft rounded-[48px] p-12 md:p-24 flex flex-col items-center text-center shadow-sticky-panel relative overflow-hidden"
          >
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-warning/10 rounded-full blur-[100px] pointer-events-none" />
            
            <Sparkles className="w-16 h-16 text-primary mb-8 relative z-10" />
            <h2 className="text-display-lg text-ink-deep mb-6 relative z-10 tracking-tight">
              Ready to dive in?
            </h2>
            <p className="text-heading-sm font-light text-steel max-w-2xl mb-12 relative z-10">
              Join thousands of students already connecting on the fastest growing campus platform.
            </p>
            <Link
              href="/sign-up"
              className="px-12 py-5 bg-ink-deep text-canvas rounded-full text-button-md hover:bg-charcoal shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 group relative z-10"
            >
              Create your free account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </section>
      </main>
      
      <MobileBottomNav />
    </div>
  );
}
