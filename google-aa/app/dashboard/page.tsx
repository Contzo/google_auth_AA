import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { getBalance } from "@/controllers/wallet.controller";
import { Navbar } from "@/components/layout/Navbar";
import { Backdrop } from "@/components/layout/Backdrop";
import BalanceCard from "@/components/wallet/BalanceCard";
import DashboardActions from "@/components/wallet/DashboardActions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const { balance } = await getBalance(session!.user.scwAddress as string);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-base">
      <Backdrop variant="dashboard" />
      <Navbar user={session!.user} />

      <div className="relative z-1 flex-1 px-6 py-10">
        <div className="mx-auto w-full max-w-115">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-serif text-[26px] tracking-tight text-ink">
              Overview
            </h2>
            <span className="font-mono text-[11.5px] text-dim">/dashboard</span>
          </div>

          <div className="space-y-4">
            <BalanceCard
              balanceWei={balance}
              address={session!.user.scwAddress as string}
            />
            <DashboardActions balanceWei={balance} />
          </div>
        </div>
      </div>
    </main>
  );
}
