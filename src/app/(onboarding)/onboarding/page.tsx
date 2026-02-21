"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { m, LazyMotion, domAnimation, AnimatePresence, type Variants } from "framer-motion"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Camera,
  GraduationCap,
  FlaskConical,
  BookOpen,
  Rocket,
  Star,
  Sparkles,
  Users,
  Zap,
  Brain,
  Code2,
  Database,
  Cloud,
  Shield,
  Globe,
  BarChart3,
  Microscope,
  Pen,
  Music,
  TrendingUp,
  Heart,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6

const ROLES = [
  { value: "Student" as const,           label: "Student",          icon: BookOpen,     desc: "Undergraduate or postgraduate student" },
  { value: "Research Scholar" as const,  label: "Research Scholar", icon: FlaskConical,  desc: "PhD / research fellow" },
  { value: "Faculty" as const,           label: "Faculty",          icon: GraduationCap, desc: "Professor or teaching staff" },
]

const EXPERIENCE_LEVELS = [
  { value: "Beginner" as const,      label: "Beginner",      emoji: "🌱" },
  { value: "Intermediate" as const,  label: "Intermediate",  emoji: "🚀" },
  { value: "Advanced" as const,      label: "Advanced",      emoji: "⚡" },
  { value: "Expert" as const,        label: "Expert",        emoji: "🏆" },
]

const SKILL_CHIPS = [
  { label: "Machine Learning",    icon: Brain },
  { label: "Web Development",     icon: Code2 },
  { label: "Data Science",        icon: BarChart3 },
  { label: "Cloud Computing",     icon: Cloud },
  { label: "Cybersecurity",       icon: Shield },
  { label: "Blockchain",          icon: Globe },
  { label: "Research & Writing",  icon: Pen },
  { label: "Databases",           icon: Database },
  { label: "Bioinformatics",      icon: Microscope },
  { label: "UI/UX Design",        icon: Star },
  { label: "Product Management",  icon: TrendingUp },
  { label: "Open Source",         icon: Rocket },
  { label: "AR / VR",             icon: Zap },
  { label: "Robotics",            icon: Sparkles },
  { label: "Music & Audio Tech",  icon: Music },
  { label: "Social Impact",       icon: Heart },
]

// ─── Animation variants ────────────────────────────────────────────────────────

const slideIn: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.3 } }),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full flex gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-all duration-500",
            i < step ? "brand-gradient" : i === step ? "bg-primary/40" : "bg-border"
          )}
        />
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const onboardingStatus = useQuery(api.users.getOnboardingStatus)
  const completeOnboarding = useMutation(api.users.completeOnboarding)

  const [step, setStep]      = useState(0)
  const [direction, setDir]  = useState(1)
  const [loading, setLoading] = useState(false)

  // Form state
  const [name,        setName]        = useState(user?.fullName ?? "")
  const [username,    setUsername]    = useState(user?.username ?? "")
  const [bio,         setBio]         = useState("")
  const [university,  setUniversity]  = useState("")
  const [role,        setRole]        = useState<"Student" | "Research Scholar" | "Faculty">("Student")
  const [expLevel,    setExpLevel]    = useState<"Beginner" | "Intermediate" | "Advanced" | "Expert">("Beginner")
  const [skills,      setSkills]      = useState<string[]>([])
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Redirect if already completed
  if (isLoaded && onboardingStatus?.complete) {
    router.replace("/feed")
    return null
  }

  const goNext = () => { setDir(1);  setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)) }
  const goPrev = () => { setDir(-1); setStep((s) => Math.max(s - 1, 0)) }

  const toggleSkill = (label: string) => {
    setSkills((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    )
  }

  const handleFinish = async () => {
    if (!name.trim() || !username.trim()) return
    setLoading(true)
    try {
      await completeOnboarding({
        name: name.trim(),
        username: username.trim(),
        bio:        bio.trim() || undefined,
        university: university.trim() || undefined,
        role,
        skills,
        researchInterests: skills,
        profilePicture: user?.imageUrl ?? undefined,
      })
      goNext() // advance to celebration
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    )
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="w-full max-w-lg mx-auto">

        {/* Card */}
        <div className="rounded-3xl border border-border bg-card shadow-elevation-4 overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1.5 w-full brand-gradient" />

          <div className="p-8">
            {/* Step counter + progress */}
            {step < TOTAL_STEPS - 1 && (
              <div className="mb-8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Step {step + 1} of {TOTAL_STEPS - 1}
                  </span>
                  {step > 0 && (
                    <button
                      onClick={goPrev}
                      className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                  )}
                </div>
                <ProgressBar step={step} />
              </div>
            )}

            {/* Steps */}
            <AnimatePresence custom={direction} mode="wait">
              <m.div
                key={step}
                custom={direction}
                variants={slideIn}
                initial="enter"
                animate="center"
                exit="exit"
              >

                {/* ── Step 0: Welcome ── */}
                {step === 0 && (
                  <div className="flex flex-col items-center text-center gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-3xl brand-gradient flex items-center justify-center shadow-glow">
                        <GraduationCap className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute -right-1 -top-1 h-7 w-7 rounded-full bg-amber-400 flex items-center justify-center shadow">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl font-extrabold text-foreground font-display leading-tight">
                        Welcome to<br />
                        <span className="text-gradient">Campus Connect! 🎓</span>
                      </h1>
                      <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed max-w-sm mx-auto">
                        Let&apos;s set up your profile in 5 quick steps so you can start connecting, collaborating, and growing.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 w-full mt-2">
                      {[
                        { icon: Users,   text: "Network"   },
                        { icon: Trophy,  text: "Grow"      },
                        { icon: Rocket,  text: "Discover"  },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 py-4">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="text-[12px] font-semibold text-foreground">{text}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="lg" className="btn-gradient rounded-xl h-12 w-full text-base font-bold mt-2" onClick={goNext}>
                      Let&apos;s get started <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* ── Step 1: Profile photo + name ── */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-foreground font-display">Your profile</h2>
                      <p className="mt-1 text-[14px] text-muted-foreground">How should others see you?</p>
                    </div>
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="relative group"
                        aria-label="Upload profile picture"
                      >
                        {user?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.imageUrl} alt="avatar" className="h-24 w-24 rounded-full object-cover story-ring" />
                        ) : (
                          <div className="h-24 w-24 rounded-full brand-gradient flex items-center justify-center text-white text-3xl font-bold">
                            {(name || "?")[0]}
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
                      <p className="text-[12px] text-muted-foreground">Tap to change photo</p>
                    </div>
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-foreground">Full name *</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your real name" className="rounded-xl h-11" />
                    </div>
                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-foreground">Username *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[14px]">@</span>
                        <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="your_handle" className="rounded-xl h-11 pl-8" />
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="btn-gradient rounded-xl h-12 w-full font-bold"
                      onClick={goNext}
                      disabled={!name.trim() || !username.trim()}
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* ── Step 2: Bio + University ── */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-foreground font-display">About you</h2>
                      <p className="mt-1 text-[14px] text-muted-foreground">Let people know who you are and where you study.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-foreground">University / Institution</label>
                      <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="IIT Delhi, NTU, MIT…" className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-foreground">Bio</label>
                      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Researcher in NLP · CS grad · Love hackathons" maxLength={200} rows={3} className="rounded-xl resize-none" />
                      <p className="text-[11px] text-right text-muted-foreground">{bio.length}/200</p>
                    </div>
                    <Button size="lg" className="btn-gradient rounded-xl h-12 w-full font-bold" onClick={goNext}>
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* ── Step 3: Role ── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-foreground font-display">Your role</h2>
                      <p className="mt-1 text-[14px] text-muted-foreground">Help us personalise your experience.</p>
                    </div>
                    <div className="space-y-3">
                      {ROLES.map(({ value, label, icon: Icon, desc }) => (
                        <button
                          key={value}
                          onClick={() => setRole(value)}
                          className={cn(
                            "w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                            role === value
                              ? "border-primary/50 bg-primary/5 shadow-sm"
                              : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                          )}
                        >
                          <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-semibold text-foreground">{label}</p>
                            <p className="text-[12px] text-muted-foreground">{desc}</p>
                          </div>
                          {role === value && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-foreground">Experience level</label>
                      <div className="grid grid-cols-4 gap-2">
                        {EXPERIENCE_LEVELS.map(({ value, label, emoji }) => (
                          <button
                            key={value}
                            onClick={() => setExpLevel(value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border py-3 text-center transition-all duration-200",
                              expLevel === value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/30"
                            )}
                          >
                            <span className="text-lg">{emoji}</span>
                            <span className="text-[11px] font-semibold">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button size="lg" className="btn-gradient rounded-xl h-12 w-full font-bold" onClick={goNext}>
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* ── Step 4: Skills / Interests ── */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-foreground font-display">Your interests</h2>
                      <p className="mt-1 text-[14px] text-muted-foreground">
                        Pick at least 3 to personalise your feed.{" "}
                        <span className="text-primary font-semibold">{skills.length} selected</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_CHIPS.map(({ label, icon: Icon }) => {
                        const selected = skills.includes(label)
                        return (
                          <button
                            key={label}
                            onClick={() => toggleSkill(label)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200",
                              selected
                                ? "border-primary bg-primary text-primary-foreground shadow-glow-sm"
                                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    <Button
                      size="lg"
                      className="btn-gradient rounded-xl h-12 w-full font-bold"
                      onClick={handleFinish}
                      disabled={skills.length < 3 || loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Saving…</span>
                      ) : (
                        <span className="flex items-center gap-2">Finish setup <Check className="h-4 w-4" /></span>
                      )}
                    </Button>
                  </div>
                )}

                {/* ── Step 5: Celebration ── */}
                {step === 5 && (
                  <div className="flex flex-col items-center text-center gap-6 py-4">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-3xl brand-gradient flex items-center justify-center shadow-glow animate-fade-in-scale">
                        <Trophy className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-extrabold text-foreground font-display leading-tight">
                        You&apos;re all set,{" "}
                        <span className="text-gradient">{name.split(" ")[0]}! 🎉</span>
                      </h2>
                      <p className="mt-3 text-[15px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Your profile is ready. Time to explore your feed, discover researchers, and start connecting.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {[
                        { icon: Users,   text: "Discover peers"    },
                        { icon: Rocket,  text: "Join hackathons"   },
                        { icon: BookOpen, text: "Share research"   },
                        { icon: Star,    text: "Earn reputation"   },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-[13px] font-medium text-foreground">{text}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="lg" className="btn-gradient rounded-xl h-12 w-full text-base font-bold mt-2" onClick={() => router.push("/feed")}>
                      Go to my feed <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Skip link */}
        {step > 0 && step < 5 && (
          <p className="mt-4 text-center text-[13px] text-muted-foreground">
            <button
              className="underline-offset-4 hover:underline hover:text-foreground transition-colors"
              onClick={() => router.push("/feed")}
            >
              Skip for now
            </button>
          </p>
        )}
      </div>
    </LazyMotion>
  )
}
