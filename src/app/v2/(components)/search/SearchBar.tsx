'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
    initialQuery?: string;
};

export function SearchBar({ initialQuery = '' }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);

    useEffect(() => {
        setQuery(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        } else {
            router.push('/search');
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for posts, people, communities..."
                className="w-full pl-10 pr-4 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
        </form>
    );
}
