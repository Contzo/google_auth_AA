import MintCard from "./MintCard";
import TransferCard from "./TransferCard";

interface DashboardActionsProps {
  balanceWei: string;
}

export default function DashboardActions({ balanceWei }: DashboardActionsProps) {
  return (
    <div className="space-y-4">
      <MintCard />
      <TransferCard balanceWei={balanceWei} />
    </div>
  );
}
