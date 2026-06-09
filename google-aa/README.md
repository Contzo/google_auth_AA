# Nexus Wallet

A smart contract wallet powered by **ERC-4337 Account Abstraction**. Users sign in with Google and get a non-custodial smart account on Sepolia — no seed phrase, no gas management. Transactions are sponsored by a paymaster and submitted via a bundler.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | NextAuth.js — Google OAuth 2.0, JWT sessions |
| Blockchain | Viem 2.x — public + wallet clients |
| Account Abstraction | ERC-4337 — EntryPoint, SCW, SCWFactory, Paymaster |
| Network | Sepolia testnet |
| Async state | TanStack React Query 5 |
| Styling | Tailwind CSS 4, Google Fonts (Hanken Grotesk, Instrument Serif, IBM Plex Mono) |

---

## How it works

1. The user signs in via Google OAuth — NextAuth creates a JWT session.
2. On first login a **Smart Contract Wallet (SCW)** is deployed deterministically from the user's Google `sub` ID via the `SCWFactory`.
3. Wallet operations (mint, transfer) are packed as **UserOperations**, gas-estimated against the bundler RPC, signed by the server signer, and submitted via `eth_sendUserOperation`.
4. A **Paymaster** sponsors all gas so the user never needs ETH.

---

## Project Structure

```
app/
├── api/
│   ├── auth/          # NextAuth handler
│   └── wallet/        # REST routes: /balance, /mint, /transfer
├── components/
│   ├── layout/        # Navbar, Backdrop
│   ├── ui/            # Button, Card, Field, StatusMessage, Avatar
│   └── wallet/        # BalanceCard, MintCard, TransferCard
├── controllers/       # Business logic: getBalance, mintTokens, transferTokens
├── lib/
│   ├── abi/           # Contract ABIs
│   ├── scw.ts         # SCW client
│   ├── bundlerClient.ts  # UserOp submission + receipt polling
│   ├── generatePackedUserOperation.ts
│   └── format.ts      # toWei, formatBalance, shortenAddress
└── dashboard/         # Main authenticated page
```

---

## Getting Started

Copy `.env.example` to `.env.local` and fill in the required values, then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

RPC_URL=               # Alchemy bundler RPC (Sepolia)
ENTRY_POINT=           # ERC-4337 EntryPoint address
ERC20_TOKEN=           # NXS token contract address
SCW_FACTORY=           # SCWFactory contract address
SPONSOR_CONTRACT=      # Paymaster contract address
SIGNER_PRIVATE_KEY=    # Server-side signer for UserOps
```
