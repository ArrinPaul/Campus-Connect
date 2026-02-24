'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Award, Lock, Star, MessageSquare, TrendingUp, HelpCircle, BookOpen, Share2, Users, ThumbsUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Badge icon mapping
const badgeIcons: Record<string, React.ReactNode> = {
    first_post: <Star className="h-5 w-5" />,
    first_comment: <MessageSquare className="h-5 w-5" />,
    popular_post: <TrendingUp className="h-5 w-5" />,
    helpful: <ThumbsUp className="h-5 w-5" />,
    scholar: <BookOpen className="h-5 w-5" />,
    teacher: <Share2 className="h-5 w-5" />,
    questioner: <HelpCircle className="h-5 w-5" />,
    contributor: <Award className="h-5 w-5" />,
    expert: <Award className="h-5 w-5" />,
    legend: <Zap className="h-5 w-5" />,
    networker: <Users className="h-5 w-5" />,
    endorsed: <ThumbsUp className="h-5 w-5" />,
    level_5: <Star className="h-5 w-5" />,
    level_10: <Star className="h-5 w-5" />,
};

// Badge color classes based on rarity tiers
const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
    // Common
    first_post: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50' },
    first_comment: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50' },
    // Uncommon
    popular_post: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50' },
    helpful: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50' },
    scholar: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50' },
    teacher: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50' },
    questioner: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50' },
    networker: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50' },
    endorsed: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50' },
    // Rare
    contributor: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50' },
    level_5: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50' },
    // Epic
    expert: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/50' },
    level_10: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/50' },
    // Legendary
    legend: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900/50' },
};

const defaultColors = { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };

interface ProfileBadgesProps {
    userId: Id<'users'>;
}

export function ProfileBadges({ userId }: ProfileBadgesProps) {
    const achievements = useQuery(api.gamification.getAchievements, { userId });

    if (!achievements) return null;

    const earnedCount = achievements.all.filter((a: any) => a.earned).length;
    const totalCount = achievements.all.length;

    if (totalCount === 0) return null;

    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Badges & Achievements</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                    {earnedCount}/{totalCount} earned
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {achievements.all.map((achievement: any) => {
                    const colors = badgeColors[achievement.badge] || defaultColors;
                    const icon = badgeIcons[achievement.badge] || <Award className="h-5 w-5" />;

                    return (
                        <div
                            key={achievement.badge}
                            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                                achievement.earned
                                    ? `${colors.bg} ${colors.border}`
                                    : 'bg-muted/30 border-transparent opacity-40'
                            }`}
                            title={
                                achievement.earned
                                    ? `${achievement.name}: ${achievement.description}\nEarned ${achievement.earnedAt ? formatDistanceToNow(new Date(achievement.earnedAt), { addSuffix: true }) : ''}`
                                    : `${achievement.name}: ${achievement.description} (locked)`
                            }
                        >
                            <div className={achievement.earned ? colors.text : 'text-muted-foreground'}>
                                {achievement.earned ? icon : <Lock className="h-5 w-5" />}
                            </div>
                            <span className={`text-xs font-medium text-center leading-tight ${
                                achievement.earned ? '' : 'text-muted-foreground'
                            }`}>
                                {achievement.name}
                            </span>
                            {achievement.earned && achievement.earnedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                    {formatDistanceToNow(new Date(achievement.earnedAt), { addSuffix: true })}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
