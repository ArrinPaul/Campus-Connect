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

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
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

const stats = [
  { label: "Active Students", value: "10K+" },
  { label: "Research Papers", value: "2.5K+" },
  { label: "Communities", value: "500+" },
  { label: "Collaborations", value: "8K+" },
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
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    )
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <main className="flex min-h-screen flex-col bg-background overflow-hidden">

        {/* Nav */}
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-2xl">
          <div className="section-container flex h-[60px] items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl brand-gradient shadow-glow-sm">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-foreground font-display">Campus Connect</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" className="btn-gradient rounded-xl h-9 px-5 text-[13px]" asChild>
                <Link href="/sign-up">Get Started <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-44 pb-28 text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-[-10%] left-[20%] h-[500px] w-[500px] animate-pulse-soft rounded-full bg-primary/[0.06] blur-[100px]" />
            <div className="absolute top-[5%] right-[10%] h-[400px] w-[400px] animate-pulse-soft rounded-full bg-primary/[0.04] blur-[80px]" style={{ animationDelay: "0.7s" }} />
            <div className="absolute bottom-[10%] left-[5%] h-[350px] w-[350px] animate-pulse-soft rounded-full bg-primary/[0.05] blur-[90px]" style={{ animationDelay: "1.4s" }} />
            <div className="absolute inset-0 bg-dot-pattern opacity-30" />
          </div>

          <m.div initial="hidden" animate="visible" className="flex flex-col items-center max-w-5xl">
            <m.div custom={0} variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-1.5 text-[13px] text-muted-foreground backdrop-blur-sm shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>The academic social network you&apos;ve been waiting for</span>
            </m.div>

            <m.h1 custom={1} variants={fadeUp} className="text-5xl sm:text-6xl lg:text-[80px] font-extrabold tracking-tight text-foreground leading-[1.04] font-display">
              Your Campus,{" "}
              <span className="text-gradient">Connected.</span>
            </m.h1>

            <m.p custom={2} variants={fadeUp} className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Connect with peers, collaborate on research, find jobs, and build your academic career — all in one beautifully designed social platform.
            </m.p>

            <m.div custom={3} variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="btn-gradient rounded-xl h-12 px-8 text-base font-semibold shadow-glow" asChild>
                <Link href="/sign-up">Join for Free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-xl h-12 px-8 text-base border-border/60" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </m.div>

            <m.div custom={4} variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary/70" />100% Free</span>
              <span className="h-3.5 w-px bg-border hidden sm:block" />
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary/70" />Real-time</span>
              <span className="h-3.5 w-px bg-border hidden sm:block" />
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary/70" />AI-powered</span>
            </m.div>
          </m.div>

          {/* Live feed preview */}
          <m.div custom={5} variants={fadeUp} className="mt-20 w-full max-w-4xl mx-auto">
            <div className="relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-elevation-4 overflow-hidden p-4 sm:p-6">
              <div className="space-y-3">
                {[
                  { name: "Priya M.", role: "AI Researcher", time: "2m", content: "Just published on transformer architectures for low-resource NLP! Looking for collaborators 🚀", likes: 42, comments: 8 },
                  { name: "Rohan G.", role: "CS Scholar", time: "15m", content: "Our team won HackCon 2025! Built a real-time sign language translator using computer vision 🏆", likes: 128, comments: 24 },
                  { name: "Shreya I.", role: "ML Engineer", time: "1h", content: "Hot take: the best ML papers come from applied problems, not theoretical ones. Change my mind.", likes: 89, comments: 47 },
                ].map((post, i) => (
                  <div key={i} className="flex gap-3 rounded-xl bg-background/50 p-3 border border-border/40">
                    <div className="h-9 w-9 rounded-full bg-primary/10 shrink-0 flex items-center justify-center text-primary text-xs font-bold">{post.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{post.name}</span>
                        <span className="text-[11px] text-muted-foreground">{post.role}</span>
                        <span className="ml-auto text-[11px] text-muted-foreground">{post.time}</span>
                      </div>
                      <p className="text-[13px] text-foreground/80 line-clamp-2 leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Heart className="h-3 w-3 text-muted-foreground" />{post.likes}</span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><MessageSquare className="h-3 w-3 text-muted-foreground" />{post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />
            </div>
          </m.div>
        </section>

        {/* Stats */}
        <section className="border-y border-border/50 bg-muted/20">
          <div className="section-container py-12">
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <m.div key={stat.label} custom={i} variants={scaleIn} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-3xl sm:text-4xl font-extrabold font-display text-gradient">{stat.value}</span>
                  <span className="text-[13px] text-muted-foreground font-medium">{stat.label}</span>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="section-container">
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
              <m.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[13px] text-primary font-medium mb-5">
                <TrendingUp className="h-3.5 w-3.5" /> Everything you need
              </m.div>
              <m.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-display">Built for Academic Excellence</m.h2>
              <m.p custom={2} variants={fadeUp} className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">From networking to research, everything is designed to accelerate your academic journey.</m.p>
            </m.div>
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, i) => (
                <m.div key={feature.title} custom={i} variants={fadeUp} className={`group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-elevation-3 hover:border-primary/20 hover:-translate-y-0.5 overflow-hidden`}>
                  <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 bg-primary" />
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground mb-2 font-display">{feature.title}</h3>
                  <p className="text-[13.5px] text-muted-foreground leading-relaxed">{feature.description}</p>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-muted/20 border-y border-border/50">
          <div className="section-container">
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
              <m.h2 custom={0} variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">Loved by Students</m.h2>
              <m.p custom={1} variants={fadeUp} className="mt-3 text-muted-foreground text-lg">Join thousands already building their academic futures</m.p>
            </m.div>
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <m.div key={t.name} custom={i} variants={fadeUp} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-[14px] text-foreground/80 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">{t.name[0]}</div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28">
          <div className="section-container">
            <m.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="relative rounded-3xl overflow-hidden text-center px-8 py-20">
              <div className="absolute inset-0 brand-gradient opacity-95" />
              <div className="absolute inset-0 bg-dot-pattern opacity-10" />
              <div className="absolute top-[-20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-[-20%] left-[-10%] h-[350px] w-[350px] rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <m.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-[13px] text-white/90 mb-6">
                  <Sparkles className="h-3.5 w-3.5" /> Free forever for students
                </m.div>
                <m.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-display leading-tight">Start your academic journey today</m.h2>
                <m.p custom={2} variants={fadeUp} className="mt-5 max-w-xl mx-auto text-lg text-white/80">Join 10,000+ students and researchers already using Campus Connect.</m.p>
                <m.div custom={3} variants={fadeUp} className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl h-12 px-8 font-bold text-base shadow-elevation-3" asChild>
                    <Link href="/sign-up">Create Free Account <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/15 rounded-xl h-12 px-8 text-base bg-white/10" asChild>
                    <Link href="/sign-in">Already have an account?</Link>
                  </Button>
                </m.div>
              </div>
            </m.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/10 py-12">
          <div className="section-container">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl brand-gradient">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-foreground font-display">Campus Connect</span>
              </Link>
              <div className="flex items-center gap-6 text-[13px] text-muted-foreground">
                <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link>
                <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link>
              </div>
              <p className="text-[13px] text-muted-foreground">&copy; {new Date().getFullYear()} Campus Connect. Made with ❤️ for students.</p>
            </div>
          </div>
        </footer>
      </main>
    </LazyMotion>
  )
}
