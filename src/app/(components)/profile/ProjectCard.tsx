'use client';

import type { Doc } from '@/lib/api';
import { Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

type Project = Doc<'projects'>;

type Props = {
    project: Project;
};

export function ProjectCard({ project }: Props) {
    // Real portfolio_projects columns: id, user_id, title, description, url,
    // image_url, created_at — no startDate/endDate/techStack/links exist.
    const formattedCreatedAt = project.created_at ? format(new Date(project.created_at), 'MMM yyyy') : null;

    return (
        <div className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <h3 className="font-bold text-lg text-primary line-clamp-1">{project.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{project.description}</p>

            {formattedCreatedAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                    <Calendar className="h-3.5 w-3.5" /> Added {formattedCreatedAt}
                </div>
            )}

            {project.url && (
                <div className="flex flex-wrap gap-2 mt-3 border-t pt-3">
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                        <ExternalLink className="h-3 w-3" /> View Project
                    </a>
                </div>
            )}
        </div>
    );
}
