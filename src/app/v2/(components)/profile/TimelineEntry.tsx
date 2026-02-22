'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import { Calendar, GraduationCap, Award, BookOpen, Star } from 'lucide-react';
import { format } from 'date-fns';

type TimelineItem = Doc<'timeline'>;

type Props = {
    item: TimelineItem;
};

const TYPE_ICONS = {
    course: GraduationCap,
    certification: Award,
    publication: BookOpen,
    award: Star,
};

export function TimelineEntry({ item }: Props) {
    const Icon = TYPE_ICONS[item.type];
    const formattedDate = format(new Date(item.date), 'MMM yyyy');

    return (
        <div className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors flex items-start gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                {item.institution && <p className="text-sm text-muted-foreground mt-1">{item.institution}</p>}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formattedDate}
                </p>
            </div>
        </div>
    );
}
