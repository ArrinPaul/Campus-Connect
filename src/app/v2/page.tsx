'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
      {/* Background Orbs/Glow (for liveliness) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute top-1/4 left-1/4 h-64 w-64 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
        className="absolute top-1/2 right-1/4 h-72 w-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"
      />

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 max-w-3xl"
      >
        <h1 className="text-6xl font-extrabold text-foreground leading-tight mb-6">
          Connect, Collaborate, Conquer
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Campus Connect is the all-in-one platform for students, researchers, and faculty.
          Unite with your academic community like never before.
        </p>

        <div className="flex justify-center gap-4">
          <Link href="/sign-up" passHref>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <UserPlus className="h-6 w-6" /> Get Started
            </motion.button>
          </Link>
          <Link href="/sign-in" passHref>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-transparent border-2 border-border text-foreground text-lg font-semibold rounded-full shadow-lg hover:bg-muted transition-colors flex items-center gap-2"
            >
              <LogIn className="h-6 w-6" /> Log In
            </motion.button>
          </Link>
        </div>

        <div className="mt-16 text-muted-foreground text-lg">
          <p>Already a member? <Link href="/feed" className="text-primary hover:underline flex items-center justify-center gap-1 mt-2">Go to your feed <ArrowRight className="h-5 w-5" /></Link></p>
        </div>
      </motion.div>
    </div>
  );
}
