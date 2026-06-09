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
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user.email?.[0] ?? "?").toUpperCase();

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

        <button className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 transition-colors hover:border-dim">
          <Avatar src={user.image} initials={initials} size={30} />
          <span className="text-[13px] text-muted">{user.email}</span>
          <ChevronDown size={13} className="text-dim" />
        </button>
      </div>
    </header>
  );
}
