// app/lib/scwFactory.ts
import { keccak256, concat, toBytes, decodeEventLog } from "viem";
import { ScwFactoryAbi } from "./abi/ScwFactory";
import { rawEnv } from "./env";
import { walletClient } from "./viemClient";

export class ScwFactory {
  private factoryAddress: `0x${string}`;

  constructor(factoryAddress: `0x${string}`) {
    this.factoryAddress = factoryAddress;
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
      const { request } = await walletClient.simulateContract({
        address: this.factoryAddress,
        abi: ScwFactoryAbi,
        functionName: "deployScw",
        args: [credentialHash],
      });
      const txHash = await walletClient.writeContract(request);
      const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash });
      const deployLog = receipt.logs.find(
        (log) => log.address.toLowerCase() === this.factoryAddress.toLowerCase(),
      );
      if (!deployLog) return null;
      const { args } = decodeEventLog({
        abi: ScwFactoryAbi,
        eventName: "SCWDeployed",
        data: deployLog.data,
        topics: deployLog.topics,
      });
      return (args as { scwAddress: `0x${string}` }).scwAddress;
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
      const scwAddress = await walletClient.readContract({
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
      const scwAddress = await walletClient.readContract({
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
