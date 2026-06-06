'use client';

import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    initialQuery?: string;
    className?: string;
};

export function SearchBar({ initialQuery = '', className }: Props) {
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
        <form 
            onSubmit={handleSearch} 
            className={cn("relative w-full max-w-2xl mx-auto group", className)}
        >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-muted-48 group-focus-within:text-primary transition-colors" />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Campus Connect..."
                className="w-full pl-11 pr-10 h-12 rounded-pill border border-hairline bg-canvas text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
            {query && (
                <button
                    type="button"
                    onClick={() => { setQuery(''); router.push('/search'); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-canvas-parchment text-ink-muted-48"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </form>
    );
}
