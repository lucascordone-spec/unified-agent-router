import axios from "axios";
import { RouteQuote } from "./types.js";

/**
 * Fetch a quote from LI.FI API (v1/quote)
 * Handles both same-chain swaps and cross-chain bridging.
 */
export async function getLifiQuote(
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    userAddress: string,
    feeWalletAddress: string
): Promise<RouteQuote | null> {
    try {
        const response = await axios.get("https://li.quest/v1/quote", {
            params: {
                fromChain: fromChainId,
                toChain: toChainId,
                fromToken: fromTokenAddress,
                toToken: toTokenAddress,
                fromAmount: amount,
                fromAddress: userAddress,
                slippage: 0.01 // 1%
            }
        });

        const data = response.data;
        if (!data || !data.estimate || !data.transactionRequest) {
            return null;
        }

        // Calculate approximate gas cost in USD from gasCosts array
        let gasCostUsd = 0;
        if (data.estimate.gasCosts && data.estimate.gasCosts.length > 0) {
            gasCostUsd = data.estimate.gasCosts.reduce((acc: number, item: any) => {
                return acc + parseFloat(item.amountUSD || "0");
            }, 0);
        }

        return {
            aggregator: "LI.FI",
            transactionData: {
                to: data.transactionRequest.to,
                data: data.transactionRequest.data,
                value: data.transactionRequest.value,
                gasLimit: data.transactionRequest.gasLimit,
                gasPrice: data.transactionRequest.gasPrice
            },
            expectedOutput: data.estimate.toAmount,
            gasCostUsd: gasCostUsd,
            routeData: data
        };
    } catch (error: any) {
        console.error("LI.FI Quote Error:", error?.response?.data?.message || error.message);
        return null;
    }
}
