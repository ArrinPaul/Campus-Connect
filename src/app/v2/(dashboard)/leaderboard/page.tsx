'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LeaderboardItem } from '../../(components)/leaderboard/LeaderboardItem';
import { useState } from 'react';
import { GraduationCap, Award } from 'lucide-react';

const LeaderboardItemSkeleton = () => (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card h-24 animate-pulse" />
);

export default function LeaderboardPage() {
    const [periodFilter, setPeriodFilter] = useState('all'); // 'weekly', 'monthly', 'all'
    const [universityFilter, setUniversityFilter] = useState('');

    const leaderboard = useQuery(api.gamification.getLeaderboard, { 
        period: periodFilter as any, 
        university: universityFilter || undefined,
    });

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-500" />
                Leaderboard
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <select 
                    value={periodFilter} 
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="all">All Time</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                </select>
                <input
                    type="text"
                    value={universityFilter}
                    onChange={(e) => setUniversityFilter(e.target.value)}
                    placeholder="Filter by university..."
                    className="w-full sm:w-auto px-3 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            <div className="space-y-4">
                 {leaderboard === undefined && (
                    [...Array(5)].map((_, i) => <LeaderboardItemSkeleton key={i} />)
                )}
                {leaderboard?.map(entry => (
                    <LeaderboardItem key={entry._id} entry={entry as any} />
                ))}
                {leaderboard?.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold">No users on the leaderboard</h3>
                        <p className="text-muted-foreground mt-2">
                            Start contributing to climb the ranks!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
