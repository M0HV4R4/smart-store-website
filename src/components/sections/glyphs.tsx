import type { SVGProps } from "react";

/** شعارات المنصات (Lucide لا يوفّرها) */
export const WindowsGlyph = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M3 5.6 10.4 4.6v7.1H3V5.6Zm8.6-1.2L21 3v8.7h-9.4V4.4ZM3 12.9h7.4v7.1L3 19V12.9Zm8.6 0H21V21l-9.4-1.3v-6.8Z" />
  </svg>
);

export const AndroidGlyph = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M6.9 5.2 5.8 3.3a.4.4 0 0 1 .7-.4l1.2 2a7.6 7.6 0 0 1 6.6 0l1.2-2a.4.4 0 1 1 .7.4l-1.1 1.9A7 7 0 0 1 19 11H5a7 7 0 0 1 1.9-5.8ZM9 8.3a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm6 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6ZM5 12.1h14v6.6a1.6 1.6 0 0 1-1.6 1.6h-.9v2.1a1.4 1.4 0 1 1-2.8 0v-2.1H9.3v2.1a1.4 1.4 0 1 1-2.8 0v-2.1h-.9A1.6 1.6 0 0 1 4 18.7v-6.6h1Zm-2.1 0a1.4 1.4 0 0 1 1.4 1.4v4.1a1.4 1.4 0 1 1-2.8 0v-4.1a1.4 1.4 0 0 1 1.4-1.4Zm18.2 0a1.4 1.4 0 0 1 1.4 1.4v4.1a1.4 1.4 0 1 1-2.8 0v-4.1a1.4 1.4 0 0 1 1.4-1.4Z" />
  </svg>
);
