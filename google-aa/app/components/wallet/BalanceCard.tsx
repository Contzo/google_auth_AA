import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { AddressChip } from "@/components/ui/AddressChip";
import { ShieldIcon } from "@/components/icons";
import { RefreshButton } from "@/components/wallet/RefreshButton";
import { formatBalance, shortenAddress, TOKEN_SYMBOL } from "@/lib/format";

interface BalanceCardProps {
  balanceWei: string;
  address: string;
}

export default function BalanceCard({ balanceWei, address }: BalanceCardProps) {
  const balance = formatBalance(balanceWei);

  return (
    <Card>
      <CardHeader title="Wallet balance" action={<RefreshButton />} />
      <CardBody className="pb-5 pt-3">
        <div className="flex items-end gap-2.5">
          <span className="num font-mono text-[52px] font-medium leading-none tracking-tight text-ink">
            {balance}
          </span>
          <span className="mb-1.5 font-mono text-[16px] font-medium text-muted">
            {TOKEN_SYMBOL}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <AddressChip label={shortenAddress(address)} value={address} />
          <span className="inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent/[0.07] px-2 py-1 font-mono text-[10.5px] uppercase tracking-wider text-accent">
            <ShieldIcon size={11} /> Smart account
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
