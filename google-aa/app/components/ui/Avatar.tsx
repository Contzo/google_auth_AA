/* eslint-disable @next/next/no-img-element */

/* ============================================================
   Avatar — user's Google photo, falling back to gradient
   initials. `src` comes from session.user.image.
   ============================================================ */

interface AvatarProps {
  src?: string | null;
  /** initials fallback, e.g. "AR" */
  initials?: string;
  size?: number;
}

export function Avatar({ src, initials = "AR", size = 34 }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt="Profile"
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="relative flex items-center justify-center rounded-full font-mono text-[12px] font-medium text-base ring-2 ring-white/10"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(150deg,#a6efdd,#3f7d72)",
      }}
    >
      {initials}
    </div>
  );
}
