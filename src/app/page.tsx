"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { LazyMotion, domAnimation, m, type Variants } from "framer-motion"
import {
  Users,
  Rocket,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Globe,
  ArrowRight,
  Sparkles,
  Star,
  Heart,
  Zap,
  Shield,
  TrendingUp,
  FlaskConical,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const features = [
  { icon: Users, title: "Smart Networking", description: "AI-powered matching connects you with peers, researchers, and faculty who share your goals." },
  { icon: FlaskConical, title: "Research Hub", description: "Collaborate, share papers, and get peer feedback — all in one place." },
  { icon: Rocket, title: "Hackathons & Events", description: "Create and join hackathons, seminars, and workshops. Build your portfolio." },
  { icon: BookOpen, title: "Academic Resources", description: "Share study materials, datasets, and course resources with your community." },
  { icon: MessageSquare, title: "Real-time Chat", description: "Instant messaging with rich media, group chats, and video calls." },
  { icon: Globe, title: "Communities", description: "Join or create academic communities around research domains and interests." },
]

const testimonials = [
  { name: "Arjun S.", role: "CS Research Scholar", text: "Found 3 co-authors for my thesis in a week! The AI matching is insanely accurate." },
  { name: "Priya M.", role: "ML Engineer", text: "It's like Instagram but for real academic content I actually care about. Addicted." },
  { name: "Rohan G.", role: "Full Stack Dev", text: "Got my current internship through the Jobs board. The platform actually delivers." },
]

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/feed")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <main className="flex min-h-screen flex-col bg-background overflow-x-hidden">
        <div className="fixed inset-0 -z-10 bg-alive" />
        
        {/* Nav */}
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-display font-bold text-foreground">Campus Connect</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" className="btn-press" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-40 pb-24 text-center">
          <m.div initial="hidden" animate="visible" className="flex flex-col items-center max-w-4xl">
            <m.div custom={0} variants={fadeInUp} className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-1 text-sm text-secondary-foreground backdrop-blur-sm shadow-soft-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>A new way to connect & collaborate</span>
            </m.div>

            <m.h1 custom={1} variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-foreground leading-tight">
              The Social Network for <span className="text-primary">Academics</span>
            </m.h1>

            <m.p custom={2} variants={fadeInUp} className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Connect with peers, collaborate on research, find jobs, and build your academic career — all in one beautifully designed social platform.
            </m.p>

            <m.div custom={3} variants={fadeInUp} className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="btn-press shadow-soft-md" asChild>
                <Link href="/sign-up">Join for Free <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
              <Button variant="secondary" size="lg" className="btn-press shadow-soft" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </m.div>
          </m.div>
        </section>

        {/* Features */}
        <section className="py-24 bg-card/50 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
              <m.h2 custom={0} variants={fadeInUp} className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-foreground">
                Everything You Need
              </m.h2>
              <m.p custom={1} variants={fadeInUp} className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                From networking to research, everything is designed to accelerate your academic journey.
              </m.p>
            </m.div>
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <m.div key={feature.title} custom={i} variants={fadeInUp} className="group relative rounded-lg border border-border bg-background p-6 transition-all duration-300 hover:shadow-soft-md hover:border-primary/30 hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1 font-display">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-12">
              <m.h2 custom={0} variants={fadeInUp} className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-foreground">Loved by Students & Researchers</m.h2>
            </m.div>
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <m.div key={t.name} custom={i} variants={fadeInUp} className="rounded-lg border border-border bg-card p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-1.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-base text-foreground/90 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">{t.name[0]}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="relative rounded-xl overflow-hidden text-center px-8 py-16 bg-primary text-primary-foreground">
              <div className="relative">
                <m.h2 custom={0} variants={fadeInUp} className="text-4xl sm:text-5xl font-extrabold tracking-tighter">
                  Start your journey today
                </m.h2>
                <m.p custom={1} variants={fadeInUp} className="mt-4 max-w-xl mx-auto text-lg text-primary-foreground/80">
                  Join 10,000+ students and researchers on the platform built for academic life.
                </m.p>
                <m.div custom={2} variants={fadeInUp} className="mt-8 flex gap-4 justify-center">
                  <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 btn-press shadow-soft-md" asChild>
                    <Link href="/sign-up">Create Free Account</Link>
                  </Button>
                </m.div>
              </div>
            </m.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
          </div>
        </footer>
      </main>
    </LazyMotion>
  )
}
