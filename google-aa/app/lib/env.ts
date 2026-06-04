// app/lib/env.ts

export type Network = "anvil" | "sepolia";

export const NETWORK = (process.env.NETWORK ?? "anvil") as Network;

/// Maps logical names to their per-network environment variable keys.
/// Add new network-specific variables here — all routes pick them up automatically.
const KEYS: Record<string, Record<Network, string>> = {
  rpcUrl:          { anvil: "ANVIL_RPC_URL",          sepolia: "SEPOLIA_RPC_URL" },
  entryPoint:      { anvil: "ANVIL_ENTRY_POINT",       sepolia: "SEPOLIA_ENTRY_POINT" },
  scwFactory:      { anvil: "ANVIL_SCW_FACTORY",       sepolia: "SEPOLIA_FACTORY" },
  erc20Token:      { anvil: "ANVIL_ERC20_TOKEN",       sepolia: "SEPOLIA_ERC20_TOKEN" },
  sponsorContract: { anvil: "ANVIL_SPONSOR_CONTRACT",  sepolia: "" },
  signerKey:       { anvil: "LOCAL_SIGNER_KEY",        sepolia: "SEPOLIA_SIGNER_KEY" },
};

/// Reads a required env variable by raw key name. Throws if missing.
export function rawEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

/// Reads a network-specific env variable by logical name.
/// The active network is controlled by the NETWORK env variable (default: "anvil").
export function env(name: keyof typeof KEYS): string {
  return rawEnv(KEYS[name][NETWORK]);
}
