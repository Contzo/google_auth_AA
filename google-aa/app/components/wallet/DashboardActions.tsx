import MintCard from "./MintCard";
import TransferCard from "./TransferCard";

export default function DashboardActions() {
  return (
    <div className="space-y-4">
      <MintCard />
      <TransferCard />
    </div>
  );
}
