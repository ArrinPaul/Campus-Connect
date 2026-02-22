'use client';

import { BookmarkedPostList } from '../../(components)/bookmarks/BookmarkedPostList';

export default function BookmarksPage() {
    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Bookmarks</h1>
            <BookmarkedPostList />
        </div>
    );
}
