import { Logomark } from "../icons";
export default function Logo() {
  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-2xl bg-accent/10 blur-xl" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-[18px] border border-line bg-linear-to-b from-raised to-surface shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_20px_40px_-20px_rgba(0,0,0,0.9)]">
        <Logomark size={30} />
      </div>
    </div>
  );
}
