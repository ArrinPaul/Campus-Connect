'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { api } from '@/lib/api';
import { SearchBar } from '../../(components)/search/SearchBar';
import { PostCard } from '@/components/posts/PostCard';
import { UserCard } from '../../(components)/search/UserCard';
import { HashtagCard } from '../../(components)/search/HashtagCard';
import { Section, SectionHeader } from '@/components/ui/Section';
import { cn } from '@/lib/utils';
import { Search, Inbox } from 'lucide-react';

type Tab = 'all' | 'posts' | 'people' | 'hashtags';

const SearchResultsSkeleton = () => (
 <div className="w-full space-y-4">
 <div className="h-12 w-full bg-canvas animate-pulse rounded-pill" />
 <div className="flex gap-4 border-b border-hairline py-4">
 {[...Array(4)].map((_, i) => <div key={i} className="h-6 w-16 bg-canvas animate-pulse rounded" />)}
 </div>
 {[...Array(3)].map((_, i) => <div key={i} className="h-32 w-full bg-canvas animate-pulse rounded-lg" />)}
 </div>
);

function SearchResultsContent() {
 const searchParams = useSearchParams();
 const currentQuery = searchParams.get('q') || '';
 const [activeTab, setActiveTab] = useState<Tab>('all');

 const { isSignedIn } = useUser();
 const isAuthenticated = isSignedIn ?? false;
 const searchResult = useQuery(
 api.search.universalSearch,
 isAuthenticated && currentQuery ? { query: currentQuery } :"skip"
 );
 const users = searchResult?.users ?? [];
 const posts = searchResult?.posts ?? [];
 const hashtags = searchResult?.hashtags ?? [];

 useEffect(() => {
 setActiveTab('all');
 }, [currentQuery]);

 const renderResults = () => {
 if (!currentQuery) {
 return (
 <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
 <Search size={64} className="mb-4 text-slate" />
 <h3 className="text-display-md text-ink">Discover Campus Connect.</h3>
 <p className="text-body text-slate mt-2 max-w-sm">
 Search for people, posts, or academic hashtags to expand your community.
 </p>
 </div>
 );
 }

 if (searchResult === undefined) {
 return <SearchResultsSkeleton />;
 }
 
 const hasResults = users.length > 0 || posts.length > 0 || hashtags.length > 0;

 if (!hasResults) {
 return (
 <div className="flex flex-col items-center justify-center py-32 text-center">
 <Inbox size={64} className="mb-4 text-ink/10" />
 <h3 className="text-display-md text-ink">No matches found.</h3>
 <p className="text-body text-slate mt-2 max-w-sm">
 We couldn&apos;t find anything for &ldquo;{currentQuery}&rdquo;. Try checking the spelling or using broader keywords.
 </p>
 </div>
 );
 }

 const PostGrid = ({ items }: { items: any[] }) => (
 <div className="space-y-4">
 {items.map(post => (
 <PostCard key={post._id} post={post} author={post.author} />
 ))}
 </div>
 );

 const UserGrid = ({ items }: { items: any[] }) => (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {items.map(user => (
 <UserCard key={user._id} user={user as any} />
 ))}
 </div>
 );

 switch (activeTab) {
 case 'posts':
 return posts.length > 0 ? <PostGrid items={posts} /> : <p className="text-center py-8">No posts found.</p>;
 case 'people':
 return users.length > 0 ? <UserGrid items={users} /> : <p className="text-center py-8">No people found.</p>;
 case 'hashtags':
 return hashtags.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {hashtags.map((hashtag: any) => <HashtagCard key={hashtag._id} hashtag={hashtag as any} />)}
 </div>
 ) : <p className="text-center py-8">No hashtags found.</p>;
 case 'all':
 default:
 return (
 <div className="space-y-12">
 {posts.length > 0 && (
 <div className="space-y-4">
 <div className="text-fine-print text-slate font-bold uppercase tracking-widest border-b border-hairline pb-2">Top Posts</div>
 <PostGrid items={posts} />
 </div>
 )}
 {users.length > 0 && (
 <div className="space-y-4">
 <div className="text-fine-print text-slate font-bold uppercase tracking-widest border-b border-hairline pb-2">Relevant People</div>
 <UserGrid items={users} />
 </div>
 )}
 {hashtags.length > 0 && (
 <div className="space-y-4">
 <div className="text-fine-print text-slate font-bold uppercase tracking-widest border-b border-hairline pb-2">Academic Hashtags</div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {hashtags.map((hashtag: any) => <HashtagCard key={hashtag._id} hashtag={hashtag as any} />)}
 </div>
 </div>
 )}
 </div>
 );
 }
 };

 return (
 <div className="w-full bg-canvas min-h-screen">
 {/* Header Section */}
 <Section variant="parchment" className="py-xl">
 <SectionHeader title="Search." tagline={currentQuery ? `Results for"${currentQuery}"` :"Find what you're looking for across the campus."}>
 <SearchBar className="max-w-2xl" />
 </SectionHeader>
 </Section>

 <main className="w-full flex flex-col items-center">
 <div className="w-full max-w-4xl px-4 md:px-0">
 
 {/* Tabs - Apple Style */}
 <div className="w-full flex items-center justify-center md:justify-start gap-8 h-12 border-b border-hairline mt-4 sticky top-[96px] z-30 glass bg-surface-soft">
 {[
 { id: 'all', label: 'All', count: (users?.length || 0) + (posts?.length || 0) + (hashtags?.length || 0) },
 { id: 'posts', label: 'Posts', count: posts?.length || 0 },
 { id: 'people', label: 'People', count: users?.length || 0 },
 { id: 'hashtags', label: 'Hashtags', count: hashtags?.length || 0 },
 ].map(tab => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as Tab)}
 className={cn(
"relative h-full flex items-center text-caption font-semibold transition-colors active:scale-[0.98] whitespace-nowrap",
 activeTab === tab.id ?"text-primary" :"text-slate hover:text-ink"
 )}
 >
 {tab.label} ({tab.count})
 {activeTab === tab.id && (
 <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
 )}
 </button>
 ))}
 </div>

 <div className="py-8">
 {renderResults()}
 </div>
 </div>
 </main>
 </div>
 );
}

export default function SearchPage() {
 return (
 <Suspense fallback={
 <div className="flex items-center justify-center min-h-screen bg-canvas">
 <div className="animate-pulse text-ink/30 font-display text-2xl">Searching...</div>
 </div>
 }>
 <SearchResultsContent />
 </Suspense>
 );
}

