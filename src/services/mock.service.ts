import { RouteQuote } from "./types.js";

/**
 * Returns a deterministic mock quote used when real aggregator APIs are unavailable.
 * This enables the router to remain fully functional in development environments
 * without requiring external API keys.
 */
export function getMockQuote(
  fromChainId: number,
  toChainId: number,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  userAddress: string,
  feeWalletAddress: string
): RouteQuote {
  // Generate a pseudo‑random but deterministic output based on input parameters
  const hash =
    fromChainId.toString() + toChainId.toString() + fromTokenAddress + toTokenAddress + amount;
  // Simple deterministic numeric conversion (not cryptographically secure)
  const pseudo = Array.from(hash)
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1_000_000;
  const expectedOutput = (BigInt(amount) * 95n) / 100n; // simulate 5% slippage

  const transactionData = {
    to: toTokenAddress,
    data: "0x", // empty calldata – placeholder
    value: "0",
    gasLimit: "21000",
    gasPrice: "1000000000",
    maxPriorityFeePerGas: "2000000000",
    maxFeePerGas: "3000000000",
  };

  return {
    aggregator: "Mock",
    transactionData,
    expectedOutput: expectedOutput.toString(),
    gasCostUsd: 0.001, // tiny placeholder cost
    routeData: { mock: true, pseudo },
  };
}
