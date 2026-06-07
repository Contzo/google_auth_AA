// app/lib/scwFactory.ts
import {
  keccak256,
  concat,
  toBytes,
  createWalletClient,
  publicActions,
  http,
  type WalletClient,
  type PublicActions,
  type Account,
  type Chain,
  type Transport,
} from "viem";
import { sepolia, anvil } from "viem/chains";
import { ScwFactoryAbi } from "./abi/ScwFactory";
import { env, rawEnv, NETWORK } from "./env";
import { privateKeyToAccount } from "viem/accounts";

type ExtendedWalletClient = WalletClient<Transport, Chain, Account> &
  PublicActions;

export class ScwFactory {
  private client: ExtendedWalletClient;
  private factoryAddress: `0x${string}`;

  constructor(factoryAddress: `0x${string}`) {
    this.factoryAddress = factoryAddress;
    const account = privateKeyToAccount(env("signerKey") as `0x${string}`);
    this.client = createWalletClient({
      account,
      chain: NETWORK === "anvil" ? anvil : sepolia,
      transport: http(env("rpcUrl")),
    }).extend(publicActions) as ExtendedWalletClient;
  }

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
  computeCredentialHash(googleSubId: string): `0x${string}` {
    const secret = rawEnv("SERVER_SECRET");
    return keccak256(concat([toBytes(googleSubId), toBytes(secret)]));
  }

  async deployScw(googleSubId: string): Promise<`0x${string}` | null> {
    try {
      const credentialHash = this.computeCredentialHash(googleSubId);
      const { request } = await this.client.simulateContract({
        address: this.factoryAddress,
        abi: ScwFactoryAbi,
        functionName: "deployScw",
        args: [credentialHash],
      });
      const scwAddress = await this.client.writeContract(request);
      return scwAddress as `0x${string}`;
    } catch (error) {
      console.error("[deployScw] Contract write failed:", error);
      return null;
    }
  }

  /*//////////////////////////////////////////////////////////////
                              Getters
  //////////////////////////////////////////////////////////////*/

  async predictScwAddress(googleSubId: string): Promise<`0x${string}` | null> {
    try {
      const credentialHash = this.computeCredentialHash(googleSubId);
      const scwAddress = await this.client.readContract({
        address: this.factoryAddress,
        abi: ScwFactoryAbi,
        functionName: "predictScwAddress",
        args: [credentialHash],
      });
      return scwAddress as `0x${string}`;
    } catch (error) {
      console.error("[predictScwAddress] Contract read failed:", error);
      return null;
    }
  }

  async getScwAddressFromChain(
    googleSubId: string,
  ): Promise<`0x${string}` | null> {
    try {
      const credentialHash = this.computeCredentialHash(googleSubId);
      const scwAddress = await this.client.readContract({
        address: this.factoryAddress,
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
}
