import React, { useEffect, useRef, useState } from 'react';

interface LazyIframeProps {
  src: string;
  fallbackImageSrc?: string;
  alt?: string;
  allow?: string;
  label?: string;
}

/**
 * Lazy-loading iframe that:
 * 1. Shows a rich background photo immediately.
 * 2. Mounts the actual <iframe> only when scrolled into the viewport (IntersectionObserver).
 * 3. Shows a subtle spinner while the iframe is loading.
 * 4. If the iframe fails to load, falls back to the background photo.
 */
export const LazyIframe: React.FC<LazyIframeProps> = ({
  src,
  fallbackImageSrc,
  alt = 'Property',
  allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; magnetometer; picture-in-picture; xr-spatial-tracking; fullscreen',
  label,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '100px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const effectiveFallback = fallbackImageSrc ||
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      {/* Background photo: always rendered as fallback layer */}
      <img
        src={effectiveFallback}
        alt={alt}
        onError={(e) => {
          e.currentTarget.src =
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
        }}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 1 }}
      />

      {/* Iframe: only mounted when in viewport; fades in after load */}
      {isVisible && !iframeFailed && (
        <iframe
          src={src}
          title={alt}
          onLoad={() => setIframeLoaded(true)}
          onError={() => { setIframeFailed(true); setIframeLoaded(false); }}
          allow={allow}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            zIndex: 2,
            opacity: iframeLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
            background: 'transparent',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Spinner while iframe is loading */}
      {isVisible && !iframeLoaded && !iframeFailed && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 3, background: 'rgba(0,0,0,0.12)' }}
        >
          <div className="w-7 h-7 border-2 border-white/70 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* 360° label badge */}
      {label && (
        <div
          className="absolute top-2 left-2 flex items-center gap-1 bg-black/75 px-2 py-0.5 rounded-full text-white text-[8px] font-bold backdrop-blur-md"
          style={{ zIndex: 4 }}
        >
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
          {label}
        </div>
      )}
    </div>
  );
};
