import type { ButtonHTMLAttributes, ReactNode } from "react";

/* ============================================================
   Button — primary | secondary, with a pending spinner state.
   Pure presentation: wire onClick / disabled from the parent.
   ============================================================ */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  /** show spinner + dim while a request is in flight */
  pending?: boolean;
  /** leading icon, hidden while pending */
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  pending = false,
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl px-5 " +
    "text-[14.5px] font-semibold transition-all active:scale-[0.99] select-none " +
    "disabled:cursor-not-allowed disabled:opacity-90";

  const variants = {
    primary: "bg-ink text-base hover:bg-white",
    secondary: "border border-line bg-raised text-ink hover:border-dim",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={pending || props.disabled}
      {...props}
    >
      {pending ? (
        <span className="h-4 w-4 rounded-full border-2 border-base/30 border-t-base spin" />
      ) : (
        icon
      )}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}
