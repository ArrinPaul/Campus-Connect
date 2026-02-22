'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const mediaQueryList = window.matchMedia(query);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set the initial state
    setMatches(mediaQueryList.matches);

    // Add the listener
    mediaQueryList.addEventListener('change', listener);

    // Clean up the listener on component unmount
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
