'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import { Link as LinkIcon, Calendar, Code, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

type Project = Doc<'projects'>;

type Props = {
    project: Project;
};

export function ProjectCard({ project }: Props) {
    const formattedStartDate = project.startDate ? format(new Date(project.startDate), 'MMM yyyy') : 'Present';
    const formattedEndDate = project.endDate ? format(new Date(project.endDate), 'MMM yyyy') : 'Present';

    return (
        <div className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <h3 className="font-bold text-lg text-primary line-clamp-1">{project.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{project.description}</p>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {formattedStartDate} - {formattedEndDate}
                </div>
                 {project.techStack && project.techStack.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Code className="h-3.5 w-3.5" /> {project.techStack.join(', ')}
                    </div>
                )}
            </div>

            {project.links && project.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 border-t pt-3">
                    {project.links.map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                            <ExternalLink className="h-3 w-3" /> Link
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
