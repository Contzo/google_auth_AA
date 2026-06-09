/* ============================================================
   Shared types. The session shape mirrors what NextAuth's
   useSession() exposes so swapping placeholders → real data
   is a drop-in.
   ============================================================ */

/** Subset of next-auth's session.user we actually render. */
export interface WalletUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/** Smart-account view model. `balanceWei` comes straight from
 *  GET /api/wallet/balance → { balance: string }. */
export interface WalletState {
  address: string;
  balanceWei: string;
  network: string;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";
