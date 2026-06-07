// app/lib/viemClient.ts
// Singleton viem wallet client — initialized once per server process.
import { createWalletClient, publicActions, http } from "viem";
import { sepolia, anvil } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { env, NETWORK } from "./env";
import { ScwFactory } from "./scwFactory";
import { EntryContract } from "./entryContract";

export const account = privateKeyToAccount(env("signerKey") as `0x${string}`);

export const walletClient = createWalletClient({
  account,
  chain: NETWORK === "anvil" ? anvil : sepolia,
  transport: http(env("rpcUrl")),
}).extend(publicActions);

export const scwFactory = new ScwFactory(env("scwFactory") as `0x${string}`);
export const entryContract = new EntryContract(
  env("entryPoint") as `0x${string}`,
);
