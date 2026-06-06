'use client';

import { useUser } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Button } from '@/components/ui/button';
import { GlobalNav } from '@/components/navigation/GlobalNav';

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
    <div className="min-h-screen bg-canvas">
      <GlobalNav />
      
      {/* Hero Section */}
      <Section variant="light">
        <SectionHeader
          title="Campus Connect."
          tagline="Unite with your academic community like never before. Connect, collaborate, and conquer your goals."
        >
          <Link href="/sign-up">
            <Button variant="primary" size="lg">Get Started</Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="secondary" size="lg">Sign In</Button>
          </Link>
        </SectionHeader>
        <div className="w-full max-w-4xl aspect-[21/9] bg-canvas-parchment rounded-lg shadow-product border border-hairline flex items-center justify-center text-ink/20 font-display text-4xl">
          [Product Visualization Here]
        </div>
      </Section>

      {/* Community Section */}
      <Section variant="dark">
        <SectionHeader
          title="Discover Communities."
          tagline="Join groups of like-minded researchers, students, and faculty. Share knowledge and grow together."
        >
          <Link href="/communities">
            <Button variant="primary" size="lg">Explore Groups</Button>
          </Link>
        </SectionHeader>
        <div className="w-full max-w-5xl aspect-video bg-tile-2 rounded-lg flex items-center justify-center text-white/10 font-display text-4xl">
          [Community Feed Preview]
        </div>
      </Section>

      {/* Careers/Jobs Section */}
      <Section variant="parchment">
        <SectionHeader
          title="Find your career."
          tagline="Exclusive job opportunities and internships tailored to your academic background and skills."
        >
          <Link href="/jobs">
            <Button variant="primary" size="lg">View Jobs</Button>
          </Link>
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-canvas p-8 rounded-lg border border-hairline text-left flex flex-col gap-4 shadow-sm hover:shadow-product transition-shadow duration-300">
              <div className="w-12 h-12 bg-canvas-parchment rounded-md" />
              <div className="h-6 w-3/4 bg-canvas-parchment rounded" />
              <div className="h-4 w-1/2 bg-canvas-parchment rounded" />
            </div>
          ))}
        </div>
      </Section>

      {/* Footer-like final call */}
      <Section variant="light" className="py-xxl">
        <div className="flex flex-col items-center gap-8">
          <h2 className="text-display-md font-semibold">Join the academic revolution.</h2>
          <Link href="/sign-up">
            <Button variant="primary" size="lg">Get Started for Free</Button>
          </Link>
        </div>
      </Section>
    </div>
  );
}
