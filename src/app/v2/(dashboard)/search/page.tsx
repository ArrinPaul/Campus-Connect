'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SearchBar } from '../../(components)/search/SearchBar';
import { PostCard } from '../../(components)/feed/PostCard';
import { UserCard } from '../../(components)/search/UserCard';
import { HashtagCard } from '../../(components)/search/HashtagCard';
import { FeedItem } from '../../(components)/feed/types'; // Import FeedItem type
import { Loader2 } from 'lucide-react';

type Tab = 'all' | 'posts' | 'people' | 'hashtags';

const SearchResultsSkeleton = () => (
    <div className="space-y-4">
        <div className="h-10 w-full bg-muted/50 rounded-md animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted/50 rounded-md animate-pulse" />)}
        </div>
        <div className="h-32 w-full bg-muted/50 rounded-md animate-pulse" />
        <div className="h-32 w-full bg-muted/50 rounded-md animate-pulse" />
    </div>
);

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get('q') || '';
    const [activeTab, setActiveTab] = useState<Tab>('all');

    const { users, posts, hashtags } = useQuery(
        api.search.universalSearch,
        currentQuery ? { query: currentQuery } : "skip"
    ) || { users: [], posts: [], hashtags: [] };

    useEffect(() => {
        // Reset to 'all' tab if query changes
        setActiveTab('all');
    }, [currentQuery]);

    const renderResults = () => {
        if (!currentQuery) {
            return (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg">Start typing to search for posts, people, or hashtags.</p>
                </div>
            );
        }

        if (users === undefined || posts === undefined || hashtags === undefined) {
            return <SearchResultsSkeleton />;
        }
        
        const hasResults = users.length > 0 || posts.length > 0 || hashtags.length > 0;

        if (!hasResults) {
            return (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg">No results found for "{currentQuery}".</p>
                    <p className="text-sm">Try a different search term.</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'posts':
                return posts.length > 0 ? (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <PostCard key={post._id} item={{ type: 'post', post: post as any, _id: post._id, createdAt: post.createdAt }} />
                        ))}
                    </div>
                ) : <div className="text-center py-8 text-muted-foreground">No posts found.</div>;
            case 'people':
                return users.length > 0 ? (
                    <div className="space-y-4">
                        {users.map(user => (
                            <UserCard key={user._id} user={user as any} />
                        ))}
                    </div>
                ) : <div className="text-center py-8 text-muted-foreground">No people found.</div>;
            case 'hashtags':
                return hashtags.length > 0 ? (
                    <div className="space-y-4">
                        {hashtags.map(hashtag => (
                            <HashtagCard key={hashtag._id} hashtag={hashtag as any} />
                        ))}
                    </div>
                ) : <div className="text-center py-8 text-muted-foreground">No hashtags found.</div>;
            case 'all':
            default:
                return (
                    <div className="space-y-8">
                        {posts.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">Posts ({posts.length})</h3>
                                <div className="space-y-4">
                                    {posts.map(post => (
                                        <PostCard key={post._id} item={{ type: 'post', post: post as any, _id: post._id, createdAt: post.createdAt }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {users.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold mb-4">People ({users.length})</h3>
                                <div className="space-y-4">
                                    {users.map(user => (
                                        <UserCard key={user._id} user={user as any} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {hashtags.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold mb-4">Hashtags ({hashtags.length})</h3>
                                <div className="space-y-4">
                                    {hashtags.map(hashtag => (
                                        <HashtagCard key={hashtag._id} hashtag={hashtag as any} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Search</h1>
            <SearchBar initialQuery={currentQuery} />

            <div className="mt-8 border-b">
                <nav className="flex gap-4" aria-label="Search result types">
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={`py-3 px-1 border-b-2 ${activeTab === 'all' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        All ({ (users?.length || 0) + (posts?.length || 0) + (hashtags?.length || 0) })
                    </button>
                    <button 
                        onClick={() => setActiveTab('posts')}
                        className={`py-3 px-1 border-b-2 ${activeTab === 'posts' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Posts ({posts?.length || 0})
                    </button>
                    <button 
                        onClick={() => setActiveTab('people')}
                        className={`py-3 px-1 border-b-2 ${activeTab === 'people' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        People ({users?.length || 0})
                    </button>
                    <button 
                        onClick={() => setActiveTab('hashtags')}
                        className={`py-3 px-1 border-b-2 ${activeTab === 'hashtags' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Hashtags ({hashtags?.length || 0})
                    </button>
                </nav>
            </div>

            <div className="mt-8">
                {renderResults()}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResultsContent />
        </Suspense>
    );
}
