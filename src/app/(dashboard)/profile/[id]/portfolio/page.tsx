'use client';

import { Suspense } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { ProjectCard } from '../../../../(components)/profile/ProjectCard';
import { TimelineEntry } from '../../../../(components)/profile/TimelineEntry';

type PageProps = {
    params: {
        id: Id<'users'>;
    };
};

const PortfolioPageSkeleton = () => (
    <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="h-10 w-48 bg-muted/50 rounded-md animate-pulse mb-6" />
        <div className="space-y-6">
            <div className="h-8 w-full bg-muted/50 rounded-md animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-muted/50 rounded-md animate-pulse" />)}
            </div>
            <div className="h-8 w-full bg-muted/50 rounded-md animate-pulse" />
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted/50 rounded-md animate-pulse" />)}
            </div>
        </div>
    </div>
);

function PortfolioPageContent({ userId }: { userId: Id<'users'> }) {
    const user = useQuery(api.users.getUserById, { userId });
    const projects = useQuery(api.portfolio.getProjects, { userId });
    const timeline = useQuery(api.portfolio.getTimeline, { userId });

    if (user === undefined || projects === undefined || timeline === undefined) {
        return <PortfolioPageSkeleton />;
    }

    if (user === null) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link href={`/profile/${userId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to {user.name}&apos;s Profile
            </Link>

            <h1 className="text-3xl font-bold mb-6">Portfolio for {user.name}</h1>

            <section className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Projects</h2>
                    {/* TODO: Add 'Add Project' button if currentUser is owner */}
                    <button className="h-9 px-3 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add Project
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.length === 0 ? (
                        <p className="col-span-full text-muted-foreground">No projects added yet.</p>
                    ) : (
                        projects.map(project => <ProjectCard key={project._id} project={project as any} />)
                    )}
                </div>
            </section>

            <section>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Timeline</h2>
                    {/* TODO: Add 'Add Timeline Item' button if currentUser is owner */}
                    <button className="h-9 px-3 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add Event
                    </button>
                </div>
                <div className="space-y-4">
                    {timeline.length === 0 ? (
                        <p className="text-muted-foreground">No timeline entries yet.</p>
                    ) : (
                        timeline.map(item => <TimelineEntry key={item._id} item={item as any} />)
                    )}
                </div>
            </section>
        </div>
    );
}

export default function UserPortfolioPage({ params }: PageProps) {
    return (
        <Suspense fallback={<PortfolioPageSkeleton />}>
            <PortfolioPageContent userId={params.id} />
        </Suspense>
    );
}
