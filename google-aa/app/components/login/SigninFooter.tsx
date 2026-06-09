import { ShieldIcon } from "../icons";
export default function SigninFooter() {
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-dim">
      <ShieldIcon size={13} className="text-accentdim" />
      <span>Secured by ERC-4337 · Non-custodial</span>
    </div>
  );
}
