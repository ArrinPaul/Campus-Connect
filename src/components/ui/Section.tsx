import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "light" | "dark" | "parchment" | "dark2" | "dark3";
}

export function Section({ children, className, variant = "light" }: SectionProps) {
  const variants = {
    light: "bg-canvas text-ink",
    dark: "bg-tile-1 text-white",
    parchment: "bg-canvas-parchment text-ink",
    dark2: "bg-tile-2 text-white",
    dark3: "bg-tile-3 text-white",
  };

  return (
    <section
      className={cn(
        "w-full py-section px-4 md:px-8 flex flex-col items-center text-center overflow-hidden",
        variants[variant],
        className
      )}
    >
      <div className="max-w-[1440px] w-full flex flex-col items-center">
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({ title, tagline, children }: { title: string; tagline?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-12 flex flex-col items-center">
      <h2 className="text-display-lg md:text-hero-display mb-4 tracking-tight leading-tight">
        {title}
      </h2>
      {tagline && (
        <p className="text-lead md:text-tagline opacity-90 max-w-2xl">
          {tagline}
        </p>
      )}
      {children && <div className="mt-8 flex gap-4">{children}</div>}
    </div>
  );
}
