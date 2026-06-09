import type { ReactNode } from "react";
import { CheckIcon, AlertIcon } from "@/components/icons";

/* ============================================================
   StatusMessage — inline success / error banner shown beneath
   a card's action button after a request resolves.
   ============================================================ */

interface StatusMessageProps {
  kind: "success" | "error";
  children: ReactNode;
}

export function StatusMessage({ kind, children }: StatusMessageProps) {
  const styles = {
    success: {
      box: "bg-accent/10 border-accent/20 text-accent",
      icon: <CheckIcon size={13} />,
    },
    error: {
      box: "bg-[#f0a3a3]/10 border-[#f0a3a3]/20 text-[#f0a3a3]",
      icon: <AlertIcon size={13} />,
    },
  }[kind];

  return (
    <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] ${styles.box}`}>
      <span className="mt-0.5 shrink-0">{styles.icon}</span>
      <span className="break-all">{children}</span>
    </div>
  );
}
