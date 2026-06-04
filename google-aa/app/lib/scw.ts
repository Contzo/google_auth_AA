// app/lib/scw.ts
import {
  keccak256,
  concat,
  toBytes,
  getContract,
  createPublicClient,
  createWalletClient,
  publicActions,
  http,
} from "viem";
import { sepolia, anvil } from "viem/chains";
import { ScwFactoryAbi } from "./abi/ScwFactory";
import { env, rawEnv, NETWORK } from "./env";
import { privateKeyToAccount } from "viem/accounts";

const address = privateKeyToAccount(env("signerKey") as `0x${string}`);

export const client = createWalletClient({
  account: address,
  chain: NETWORK === "anvil" ? anvil : sepolia,
  transport: http(env("rpcUrl")),
}).extend(publicActions);

/// Computes the credentialHash from the user's Google sub ID and the server secret.
///
/// This hash is used as the CREATE2 salt in ScwFactory.deployScw()
/// and as the lookup key in ScwFactory.getScwAddress().
///
/// Formula: keccak256(googleSubIdBytes ++ serverSecretBytes)
///
/// IMPORTANT: SERVER_SECRET must never change after deployment.
/// Changing it produces a different hash for the same user,
/// permanently disconnecting them from their existing SCW.
export function computeCredentialHash(googleSubId: string): `0x${string}` {
  const secret = rawEnv("SERVER_SECRET");
  return keccak256(concat([toBytes(googleSubId), toBytes(secret)]));
}

/// Queries the ScwFactory contract for the SCW address associated with a given Google sub ID.
///
/// Returns null if:
///   - No SCW has been deployed yet for this credential
///   - The contract call fails (Anvil not running, contract not deployed)
export async function getScwAddressFromChain(
  googleSubId: string,
): Promise<`0x${string}` | null> {
  try {
    const credentialHash = computeCredentialHash(googleSubId);

    const scwAddress = await client.readContract({
      address: env("scwFactory") as `0x${string}`,
      abi: ScwFactoryAbi,
      functionName: "getScwAddress",
      args: [credentialHash],
    });

    // address(0) means no SCW has been deployed for this credential yet
    if (scwAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    return scwAddress as `0x${string}`;
  } catch (error) {
    // Fail gracefully — return null rather than crashing the auth flow
    // if Anvil is not running or the contract is not yet deployed
    console.error("[getScwAddressFromChain] Contract read failed:", error);
    return null;
  }
}

export async function deployScw(
  googleSubId: string,
): Promise<`0x${string}` | null> {
  try {
    const credentialHash = computeCredentialHash(googleSubId);
    const { request } = await client.simulateContract({
      address: env("scwFactory") as `0x${string}`,
      abi: ScwFactoryAbi,
      functionName: "deployScw",
      args: [credentialHash],
    });
    const scwAddress = await client.writeContract(request);
    return scwAddress as `0x${string}`;
  } catch (error) {
    console.error("[deployScw] Contract write failed:", error);
    return null;
  }
}

export async function anticipateScw(
  googleSubId: string,
): Promise<`0x${string}` | null> {
  try {
    const credentialHash = computeCredentialHash(googleSubId);
  } catch (error) {
    console.error("[anticipateScw] Contract write failed:", error);
    return null;
  }
}
