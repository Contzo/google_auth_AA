# Nexus Wallet

A gasless smart contract wallet where users sign in with **Google** and get a non-custodial Ethereum account — no seed phrase, no ETH required. Built on **ERC-4337 Account Abstraction** on the Sepolia testnet.

---

## How It Works

```
Google Login → credentialHash → CREATE2 SCW Address → UserOperation → EntryPoint → Execute
```

1. User authenticates with Google OAuth — a `credentialHash` is derived from their identity.
2. A **Smart Contract Wallet (SCW)** is deployed deterministically via `CREATE2` using that hash as the salt.
3. Token operations (mint, transfer) are packed as **UserOperations**, signed server-side, and submitted to the bundler.
4. A **Paymaster** sponsors all gas — the user never touches ETH.

---

## Repository Structure

```
/
├── google-aa/       # Next.js frontend + backend API
└── foundry-AA/      # Solidity smart contracts
```

---

## google-aa — Next.js App

The user-facing application. Handles Google authentication, wallet interaction, and UserOperation submission.

**Stack:** Next.js 15 · TypeScript · NextAuth.js · Viem 2.x · TanStack Query 5 · Tailwind CSS 4

### Key directories

```
google-aa/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth Google OAuth handler
│   │   └── wallet/        # REST routes: /balance, /mint, /transfer
│   ├── components/
│   │   ├── layout/        # Navbar, Backdrop
│   │   ├── ui/            # Button, Card, Field, StatusMessage, Avatar
│   │   └── wallet/        # BalanceCard, MintCard, TransferCard
│   ├── controllers/       # Business logic: getBalance, mintTokens, transferTokens
│   ├── lib/
│   │   ├── abi/           # Contract ABIs
│   │   ├── scw.ts         # SCW client
│   │   ├── bundlerClient.ts
│   │   └── generatePackedUserOperation.ts
│   └── dashboard/         # Main authenticated page
├── .env.example
└── package.json
```

### Setup

```bash
cd google-aa
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

```env
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

---

## foundry-AA — Smart Contracts

The on-chain layer. Four contracts implement the full ERC-4337 flow.

**Stack:** Solidity · Foundry · OpenZeppelin · eth-infinitism/account-abstraction

### Contracts

| Contract | Description |
|---|---|
| `SCW.sol` | Per-user smart contract wallet implementing `IAccount` |
| `ScwFactory.sol` | Deploys SCWs with deterministic CREATE2 addresses |
| `ScwToken.sol` | ERC-20 token (NXS) — the main interactive asset |
| `SponsorContract.sol` | Paymaster that sponsors gas for factory-deployed SCWs |

### Setup

**Requirement:** [Foundry](https://book.getfoundry.sh/getting-started/installation)

```bash
cd foundry-AA
forge install
cp .env.example .env
```

```env
SEPOLIA_RPC_URL=
SEPOLIA_WALLET=
SEPOLIA_ENTRY_POINT=0x0000000071727De22E5E9d8BAf0edAc6f37da032
SEPOLIA_SIGNER_KEY=
```

### Commands

```bash
# Local
make anvil                                    # Start local Anvil node
make deploy-anvil                             # Deploy all contracts

# Sepolia
make deploy-sepolia                           # Deploy all contracts
make fund-sponsor-sepolia                     # Fund the paymaster with 0.1 ETH
make deploy-scw-anvil CREDENTIAL_HASH=0x...  # Deploy a user SCW
make mint-sepolia                             # Mint tokens to an address

# Tests
forge test
forge test -vvv
```

### Transaction flow

1. Backend derives `credentialHash` from Google `sub` ID
2. `factory.predictScwAddress(hash)` — counterfactual address prediction
3. `factory.deployScw(hash)` if not yet deployed (CREATE2)
4. Backend builds and signs a `PackedUserOperation`
5. Bundler submits to `EntryPoint.handleOps()`
6. `SCW.validateUserOp()` — verifies backend signature
7. `SponsorContract.validatePaymasterUserOp()` — confirms SCW is factory-deployed
8. `SCW.execute()` — calls `ScwToken` on behalf of the user

---

## Dependencies

- [eth-infinitism/account-abstraction](https://github.com/eth-infinitism/account-abstraction) — EIP-4337 EntryPoint and interfaces
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) — ERC20, Ownable, ECDSA
- [forge-std](https://github.com/foundry-rs/forge-std)
