import type { SVGProps } from "react";

/* ============================================================
   Icons — inline SVG, stroke-based, restrained.
   `size` controls width/height; pass className for color.
   ============================================================ */

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

/** Nexus brand mark — two overlapping nodes (a "nexus" / link). */
export function Logomark({ size = 28, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} {...props}>
      <rect x="0.6" y="0.6" width="30.8" height="30.8" rx="8.4" stroke="#2b2f38" strokeWidth="1.2" />
      <rect x="0.6" y="0.6" width="30.8" height="30.8" rx="8.4" fill="url(#nexgrad)" fillOpacity="0.18" />
      <circle cx="12" cy="16" r="5.2" stroke="#86d9c6" strokeWidth="1.6" />
      <circle cx="20" cy="16" r="5.2" stroke="#f4f6f8" strokeWidth="1.6" />
      <defs>
        <linearGradient id="nexgrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#86d9c6" />
          <stop offset="1" stopColor="#0b0d10" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Official-style multi-color Google "G". */
export function GoogleIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function RefreshIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke} {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function SendIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke} {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

export function PlusIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ size = 15, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke} strokeWidth={2.2} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function AlertIcon({ size = 15, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke} strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  );
}

export function ShieldIcon({ size = 14, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke} strokeWidth={1.6} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ChevronDown({ size = 14, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CopyIcon({ size = 14, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke} strokeWidth={1.7} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
