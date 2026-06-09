import type { ReactNode } from "react";

/* ============================================================
   Card — the single shell reused across the whole app:
   Balance, Get Tokens, Send Tokens, and the login panel.

   Compose it as:
     <Card>
       <CardHeader title="…" subtitle="…" action={<Btn/>} />
       <CardBody>…</CardBody>
     </Card>
   ============================================================ */

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={
        "rounded-2xl border border-line bg-surface " +
        "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_24px_48px_-32px_rgba(0,0,0,0.9)] " +
        className
      }
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  /** optional right-aligned slot (e.g. Balance card's refresh button) */
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-5">
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-dim">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={"px-6 pb-6 pt-4 " + className}>{children}</div>;
}
