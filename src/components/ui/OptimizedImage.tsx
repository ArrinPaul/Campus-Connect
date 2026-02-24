'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

/**
 * A tiny inline SVG blur placeholder used for all images.
 * Uses a neutral gray gradient that works on both light and dark backgrounds.
 */
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#27272a"/><rect width="40" height="40" fill="url(#g)" opacity=".5"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f3f46"/><stop offset="1" stop-color="#18181b"/></linearGradient></defs></svg>'
  );

/**
 * Avatar-specific blur placeholder (circular-friendly, lighter tone).
 */
const AVATAR_BLUR_DATA_URL =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="20" fill="#3f3f46"/></svg>'
  );

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL' | 'onError'> {
  /**
   * If true, uses a circular blur placeholder suitable for avatars.
   */
  isAvatar?: boolean;
  /**
   * Fallback element shown when the image fails to load.
   * If not provided, a neutral placeholder is shown.
   */
  fallback?: React.ReactNode;
}

/**
 * Wrapper around Next.js Image with automatic blur placeholders,
 * lazy loading, and error fallback handling.
 *
 * - Adds `placeholder="blur"` with a lightweight inline SVG
 * - Defaults `loading="lazy"` (unless `priority` is set)
 * - Handles load errors gracefully with an optional fallback
 */
export function OptimizedImage({
  isAvatar = false,
  fallback,
  className,
  alt,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div
        className={`bg-zinc-800 flex items-center justify-center text-zinc-500 ${className ?? ''}`}
        style={props.fill ? { position: 'absolute', inset: 0 } : { width: props.width as number, height: props.height as number }}
        role="img"
        aria-label={alt}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-1/3 h-1/3 max-w-8 max-h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      placeholder="blur"
      blurDataURL={isAvatar ? AVATAR_BLUR_DATA_URL : BLUR_DATA_URL}
      loading={props.priority ? undefined : 'lazy'}
      className={className}
      alt={alt}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}

/**
 * Convenience export: blur data URLs for use in components that
 * can't switch to OptimizedImage but want the same placeholders.
 */
export { BLUR_DATA_URL, AVATAR_BLUR_DATA_URL };
