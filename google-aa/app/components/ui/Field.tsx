import type { InputHTMLAttributes, ReactNode } from "react";

/* ============================================================
   Field — labelled input with optional suffix (unit) and a
   trailing slot (e.g. a "Max" button). Forwards all native
   input props so the parent owns value/onChange.
   ============================================================ */

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** unit shown on the right, e.g. "NXS" */
  suffix?: string;
  /** interactive trailing element, rendered before the suffix */
  trailing?: ReactNode;
  /** use monospace + tabular numerals (addresses, amounts) */
  mono?: boolean;
}

export function Field({
  label,
  suffix,
  trailing,
  mono = false,
  className = "",
  ...props
}: FieldProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.16em] text-dim">
          {label}
        </span>
      )}
      <div className="group flex items-center gap-2 rounded-xl border border-line bg-sunken px-3.5 transition-colors focus-within:border-accentdim focus-within:bg-base">
        <input
          className={
            "h-[50px] w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-dim " +
            (mono ? "font-mono num " : "") +
            className
          }
          {...props}
        />
        {trailing}
        {suffix && (
          <span className="shrink-0 font-mono text-[13px] font-medium text-muted">{suffix}</span>
        )}
      </div>
    </label>
  );
}
