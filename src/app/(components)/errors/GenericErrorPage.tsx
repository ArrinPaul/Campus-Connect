'use client';

import { Frown } from 'lucide-react';
import Link from 'next/link';

type Props = {
    statusCode?: number;
    title?: string;
    message?: string;
    reset?: () => void; // For Next.js error boundary
};

export default function GenericErrorPage({
    statusCode,
    title = 'Something went wrong',
    message = 'We encountered an error. Please try again later or contact support.',
    reset,
}: Props) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <Frown className="h-24 w-24 text-muted-foreground mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-2">
                {statusCode ? `${statusCode} - ` : ''}{title}
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">{message}</p>
            {reset && (
                <button onClick={reset} className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Try again
                </button>
            )}
            <Link href="/feed" className="mt-4 text-primary hover:underline">
                Go to Feed
            </Link>
        </div>
    );
}
