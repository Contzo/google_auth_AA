"use client";

import { Card } from "../ui/Card";
import { GoogleIcon, CheckIcon } from "../icons";
import { signIn } from "next-auth/react";

const ASSURANCES = [
  "Smart account created on first login",
  "Gas sponsored — no ETH to start",
];

export default function SigninCard() {
  function handleSignIn() {
    signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <Card className="mt-9 bg-surface/70! p-2">
      <div className="rounded-xl bg-sunken/60 p-5">
        <button
          className="group relative flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-ink px-5 text-[15px] font-semibold text-base transition-all hover:bg-white active:scale-[0.99]"
          onClick={handleSignIn}
        >
          <span className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-white">
            <GoogleIcon size={16} />
          </span>
          <span className="whitespace-nowrap">Sign in with Google</span>
        </button>

        <div className="mt-4 flex items-center gap-2 text-[12px] text-dim">
          <div className="h-px flex-1 bg-line" />
          <span className="font-mono uppercase tracking-[0.18em]">No seed phrase</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="mt-4 grid gap-2">
          {ASSURANCES.map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-[13px] text-muted">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/10 text-accent">
                <CheckIcon size={11} />
              </span>
              {t}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
