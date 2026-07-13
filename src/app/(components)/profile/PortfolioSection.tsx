'use client';

import { useQuery } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
import { ExternalLink, Award, Code, Folder } from 'lucide-react';
import Link from 'next/link';

interface PortfolioSectionProps {
    userId: Id<'users'>;
    projects?: { title: string; url: string; description: string }[];
    certifications?: { name: string; issuer: string; date: string; url: string }[];
}

export function PortfolioSection({ userId, projects = [], certifications = [] }: PortfolioSectionProps) {
    const { isLoaded, isSignedIn } = useUser();
    const currentUser = useQuery(
        api.users.getCurrentUser,
        isLoaded && isSignedIn ? {} : 'skip'
    );

    const isOwnProfile = currentUser?._id === userId;

    if (!isOwnProfile && projects.length === 0 && certifications.length === 0) {
        return null; // Don't show if empty for viewers
    }

    return (
        <div className="mt-4 space-y-6">
            {/* Projects */}
            <div className="bg-canvas-soft border border-hairline-soft rounded-2xl p-5 shadow-subtle">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-ink-deep font-semibold">
                        <Code className="w-5 h-5 text-primary" />
                        <h3>Projects</h3>
                    </div>
                    {isOwnProfile && (
                        <button className="text-xs font-semibold text-primary hover:underline">
                            + Add Project
                        </button>
                    )}
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-6 bg-canvas border border-hairline-soft border-dashed rounded-xl">
                        <Folder className="w-8 h-8 text-steel/50 mx-auto mb-2" />
                        <p className="text-sm text-steel">No projects showcased yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.map((p, i) => (
                            <div key={i} className="bg-canvas border border-hairline-soft rounded-xl p-4 hover:shadow-sticky-panel transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-sm text-ink-deep">{p.title}</h4>
                                    {p.url && (
                                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-steel hover:text-primary">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                                <p className="text-xs text-steel line-clamp-2">{p.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Certifications */}
            <div className="bg-canvas-soft border border-hairline-soft rounded-2xl p-5 shadow-subtle">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-ink-deep font-semibold">
                        <Award className="w-5 h-5 text-warning" />
                        <h3>Certifications</h3>
                    </div>
                    {isOwnProfile && (
                        <button className="text-xs font-semibold text-primary hover:underline">
                            + Add Certification
                        </button>
                    )}
                </div>

                {certifications.length === 0 ? (
                    <div className="text-center py-6 bg-canvas border border-hairline-soft border-dashed rounded-xl">
                        <Award className="w-8 h-8 text-steel/50 mx-auto mb-2" />
                        <p className="text-sm text-steel">No certifications added yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {certifications.map((c, i) => (
                            <div key={i} className="flex items-center justify-between bg-canvas border border-hairline-soft rounded-xl p-4">
                                <div>
                                    <h4 className="font-semibold text-sm text-ink-deep">{c.name}</h4>
                                    <p className="text-xs text-steel">{c.issuer} • {c.date}</p>
                                </div>
                                {c.url && (
                                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-steel hover:text-primary px-3 py-1.5 border border-hairline-soft rounded-md text-xs font-semibold">
                                        View Credential
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
