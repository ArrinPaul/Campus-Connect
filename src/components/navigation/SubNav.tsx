import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SubNavProps {
  title: string;
  links?: { label: string; href: string }[];
  actionLabel?: string;
  onAction?: () => void;
}

export function SubNav({ title, links, actionLabel = "Join Now", onAction }: SubNavProps) {
  return (
    <div className="h-[52px] glass bg-canvas-parchment/80 border-b border-hairline flex items-center px-4 md:px-8 justify-between sticky top-[44px] z-40">
      <div className="text-tagline text-ink font-semibold">{title}</div>
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex gap-5 text-caption text-ink">
          {links?.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
