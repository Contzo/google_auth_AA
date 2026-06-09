# Foundry-AA

ERC-4337 Account Abstraction smart contracts enabling gasless transactions for Google OAuth-authenticated users. Users interact with the blockchain using only a Google login — no private keys or ETH required.

## Architecture

```
Google Login → Credential Hash → SCW Address (CREATE2) → UserOp → EntryPoint → Execute
```

- The backend derives a unique `credentialHash` from the user's Google identity
- A deterministic SCW address is predicted (or deployed) using `CREATE2` with that hash as the salt
- The backend signs and submits `PackedUserOperation`s to the EntryPoint
- The `SponsorContract` paymaster covers gas costs for all factory-deployed SCWs

## Contracts

| Contract | Description |
|---|---|
| `SCW.sol` | Per-user smart contract wallet implementing EIP-4337 `IAccount` |
| `ScwFactory.sol` | Deploys and tracks SCWs with deterministic CREATE2 addresses |
| `ScwToken.sol` | ERC-20 token — the main interactive asset of the app |
| `SponsorContract.sol` | Paymaster that sponsors gas for factory-deployed SCWs |

### SCW.sol
Validates UserOps by checking the ECDSA signature from the backend signing key. Execution is restricted to calls targeting `ScwToken` only, limiting blast radius if the signing key is compromised. The signer can be rotated via `updateUserOperationSigner()`.

### ScwFactory.sol
Authorized deployer creates SCWs with `deployScw(credentialHash)`. `predictScwAddress(credentialHash)` allows counterfactual address prediction before deployment — enabling UserOps to be submitted for accounts that don't yet exist on-chain.

### SponsorContract.sol
Holds ETH deposited into the EntryPoint. Validates `userOp.sender` against the factory's registry before sponsoring gas — rejecting any accounts not deployed by this protocol.

## Project Structure

```
foundry-AA/
├── src/
│   ├── SCW.sol
│   ├── ScwFactory.sol
│   ├── ScwToken.sol
│   ├── SponsorContract.sol
│   └── interfaces/
├── script/
│   ├── SystemDeployer.s.sol      # Deploys all contracts
│   ├── HelperConfig.s.sol        # Network config (Anvil / Sepolia)
│   ├── SendPackedUserOp.s.sol    # Generates and signs UserOps
│   ├── DeployScw.s.sol           # Deploys individual SCW
│   ├── MintScwToken.s.sol        # Mints tokens
│   └── FundSponsor.s.sol         # Funds the paymaster
├── test/
│   └── SystemUnitTest.t.sol
├── foundry.toml
└── Makefile
```

## Setup

**Requirements**: [Foundry](https://book.getfoundry.sh/getting-started/installation)

```bash
git clone <repo>
cd foundry-AA
forge install
```

Create a `.env` file:

```env
SEPOLIA_RPC_URL=
SEPOLIA_WALLET=
SEPOLIA_ENTRY_POINT=0x0000000071727De22E5E9d8BAf0edAc6f37da032
SEPOLIA_SIGNER_KEY=
```

## Usage

### Local (Anvil)

```bash
make anvil           # Start local node
make deploy-anvil    # Deploy all contracts
```

### Sepolia

```bash
make deploy-sepolia                          # Deploy all contracts
make fund-sponsor-sepolia                    # Fund the paymaster with 0.1 ETH
make deploy-scw-anvil CREDENTIAL_HASH=0x... # Deploy a user SCW
make mint-sepolia                            # Mint tokens to an address
```

## Tests

```bash
forge test
forge test -vvv   # verbose output
```

The test suite covers the full AA flow including UserOp validation, gas sponsorship, paymaster access control, and factory authorization.

## Transaction Flow

1. User logs in with Google — backend derives `credentialHash`
2. Backend predicts SCW address: `factory.predictScwAddress(hash)`
3. If SCW doesn't exist, deploy it: `factory.deployScw(hash)` (CREATE2)
4. Backend builds and signs a `PackedUserOperation`
5. Bundler submits to `EntryPoint.handleOps()`
6. EntryPoint calls `SCW.validateUserOp()` — verifies backend signature
7. `SponsorContract.validatePaymasterUserOp()` — confirms SCW is factory-deployed
8. EntryPoint calls `SCW.execute()` — calls `ScwToken` on behalf of the user

## Dependencies

- [eth-infinitism/account-abstraction](https://github.com/eth-infinitism/account-abstraction) — EIP-4337 EntryPoint and interfaces
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) — ERC20, Ownable, ECDSA
- [forge-std](https://github.com/foundry-rs/forge-std)
- [foundry-devops](https://github.com/Cyfrin/foundry-devops)
