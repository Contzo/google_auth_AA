"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Logomark, ChevronDown } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  network?: string;
}

export function Navbar({ user, network = "Base Sepolia" }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user.email?.[0] ?? "?").toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative z-10 flex items-center justify-between border-b border-line bg-base/80 px-7 py-3.5 backdrop-blur">
      <div className="flex shrink-0 items-center gap-2.5">
        <Logomark size={26} />
        <span className="whitespace-nowrap font-serif text-[20px] tracking-tight text-ink">
          Nexus Wallet
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#86d9c6]" />
          <span className="font-mono text-[11px] text-muted">{network}</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 transition-colors hover:border-dim"
          >
            <Avatar src={user.image} initials={initials} size={30} />
            <span className="text-[13px] text-muted">{user.email}</span>
            <ChevronDown
              size={13}
              className={`text-dim transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-line bg-surface shadow-lg">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-muted transition-colors hover:text-ink rounded-xl"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
