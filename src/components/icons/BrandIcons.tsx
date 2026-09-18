import React from "react";

interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * WhatsApp official brand glyph (speech bubble with telephone handset).
 * Rendered strictly in LTR without mirroring.
 */
export function WhatsAppLogo({ size = 20, className = "", ...props }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={{ direction: "ltr" }}
      aria-hidden="true"
      {...props}
    >
      <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.996.59 3.86 1.614 5.432L2.34 21.66l4.37-1.24a9.96 9.96 0 0 0 5.294 1.584c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2zm0 18.256a8.21 8.21 0 0 1-4.38-1.256l-.314-.188-2.592.736.736-2.528-.204-.33A8.204 8.204 0 0 1 3.75 12.004c0-4.552 3.702-8.254 8.254-8.254 4.552 0 8.254 3.702 8.254 8.254 0 4.552-3.702 8.252-8.254 8.252zm4.526-6.176c-.248-.124-1.468-.724-1.696-.808-.228-.082-.394-.124-.56.124-.166.248-.644.808-.788.974-.146.166-.29.186-.538.062a6.792 6.792 0 0 1-2.012-.233 7.47 7.47 0 0 1-1.385-1.214 8.28 8.28 0 0 1-.928-1.16c-.144-.248-.016-.382.108-.506.112-.11.248-.29.372-.434.124-.146.166-.248.248-.414.084-.166.042-.31-.02-.434-.064-.124-.56-1.348-.768-1.846-.202-.486-.408-.42-.56-.428l-.478-.008c-.166 0-.434.062-.662.31-.228.248-.87.85-.87 2.072 0 1.222.89 2.404 1.014 2.57.124.166 1.752 2.674 4.244 3.75.592.256 1.054.41 1.414.524.594.19 1.134.162 1.56.1.476-.07 1.468-.6 1.674-1.18.208-.58.208-1.076.146-1.18-.062-.104-.228-.166-.476-.29z" />
    </svg>
  );
}

/**
 * Facebook official brand glyph ('f' mark).
 * Rendered strictly in LTR without mirroring.
 */
export function FacebookLogo({ size = 20, className = "", ...props }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={{ direction: "ltr" }}
      aria-hidden="true"
      {...props}
    >
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

/**
 * Instagram official brand glyph (camera aperture & lens outline).
 * Rendered strictly in LTR without mirroring.
 */
export function InstagramLogo({ size = 20, className = "", ...props }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={{ direction: "ltr" }}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

