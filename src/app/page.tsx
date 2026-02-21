"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Users,
  Lightbulb,
  Rocket,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Globe,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

const features = [
  {
    icon: Users,
    title: "Smart Networking",
    description:
      "AI-powered matching connects you with students, researchers, and faculty who share your interests and goals.",
  },
  {
    icon: Lightbulb,
    title: "Research Collaboration",
    description:
      "Find collaborators, co-authors, and mentors for your research. Share papers and get peer feedback.",
  },
  {
    icon: Rocket,
    title: "Hackathons & Events",
    description:
      "Create and join hackathons, seminars, and workshops. Build your portfolio with real projects.",
  },
  {
    icon: BookOpen,
    title: "Academic Resources",
    description:
      "Share and discover study materials, research papers, datasets, and course resources.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Messaging",
    description:
      "Instant messaging with rich media support, group chats, and video calls for seamless collaboration.",
  },
  {
    icon: Globe,
    title: "Communities",
    description:
      "Join or create academic communities around departments, interests, or research domains.",
  },
]

const stats = [
  { label: "Active Users", value: "10K+" },
  { label: "Research Papers", value: "2.5K+" },
  { label: "Communities", value: "500+" },
  { label: "Collaborations", value: "8K+" },
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse-soft">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background overflow-hidden">
      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50">
        <div className="section-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow-sm">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Campus Connect
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" className="shadow-glow-sm" asChild>
              <Link href="/sign-up">
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-40 pb-24 text-center">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-dot-pattern opacity-40" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div
            custom={0}
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Built for the next generation of academics</span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]"
          >
            Your Academic Journey,{" "}
            <span className="text-gradient">Supercharged</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
          >
            Connect with peers, collaborate on research, and accelerate your
            academic career — all in one beautifully designed platform.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Button size="xl" className="shadow-glow" asChild>
              <Link href="/sign-up">
                Start for Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/sign-in">
                I have an account
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            custom={4}
            variants={fadeUp}
            className="mt-12 flex items-center gap-6 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-success" />
              End-to-end encrypted
            </span>
            <span className="hidden sm:block h-4 w-px bg-border" />
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-warning" />
              Real-time collaboration
            </span>
            <span className="hidden sm:block h-4 w-px bg-border" />
            <span className="hidden sm:flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-info" />
              Open platform
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30">
        <div className="section-container py-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────── */}
      <section className="py-24">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.p
              custom={0}
              variants={fadeUp}
              className="text-sm font-medium text-primary uppercase tracking-wider mb-3"
            >
              Everything you need
            </motion.p>
            <motion.h2
              custom={1}
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
            >
              Built for Academic Excellence
            </motion.h2>
            <motion.p
              custom={2}
              variants={fadeUp}
              className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground"
            >
              A comprehensive platform designed to make academic collaboration seamless, from research to networking.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                className="card-interactive group p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────── */}
      <section className="py-24">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="relative rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
            <div className="relative px-8 py-16 sm:px-16 text-center">
              <motion.h2
                custom={0}
                variants={fadeUp}
                className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
              >
                Ready to transform your academic experience?
              </motion.h2>
              <motion.p
                custom={1}
                variants={fadeUp}
                className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground"
              >
                Join thousands of students and researchers already using Campus Connect to accelerate their careers.
              </motion.p>
              <motion.div custom={2} variants={fadeUp} className="mt-8">
                <Button size="xl" className="shadow-glow" asChild>
                  <Link href="/sign-up">
                    Create Free Account
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="section-container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Campus Connect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Campus Connect. Built for academics, by academics.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

