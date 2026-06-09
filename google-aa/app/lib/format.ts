import { formatUnits, parseUnits } from "viem";

export const TOKEN_SYMBOL = "NXS";
export const TOKEN_DECIMALS = 18;

/** Whole tokens (user input) → wei string for API query params. */
export function toWei(amount: string, decimals = TOKEN_DECIMALS): string {
  return parseUnits(amount || "0", decimals).toString();
}

/** Wei string/bigint → formatted human-readable display string.
 *  e.g. "1250000000000000000000" → "1,250" */
export function formatBalance(
  wei: string | bigint,
  maxFractionDigits = 2,
): string {
  const units = formatUnits(BigInt(wei), TOKEN_DECIMALS);
  return Number(units).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** 0x7F3a…9C21 */
export function shortenAddress(address: string, lead = 6, tail = 4): string {
  if (address.length <= lead + tail) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}
