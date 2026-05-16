import axios from "axios";

const LIFI_API_URL = "https://li.quest/v1";

export interface RouteQuote {
    aggregator: string;
    transactionData: any;
    expectedOutput: string;
    gasCostUsd: number;
    routeData: any;
}

export async function getLifiQuote(
    fromChainId: number,
    toChainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    userAddress: string,
    feeWalletAddress: string
): Promise<RouteQuote | null> {
    try {
        // LI.FI fee is configured via fee parameter (in fraction, e.g., 0.0002 for 0.02%)
        const response = await axios.get(`${LIFI_API_URL}/quote`, {
            params: {
                fromChain: fromChainId,
                toChain: toChainId,
                fromToken: fromToken,
                toToken: toToken,
                fromAmount: amount,
                fromAddress: userAddress,
                fee: 0.0002, // 0.02% protocol fee
                integrator: "unified-router-bot" // LIFI integrator string (max 23 chars). El fee va al owner de este integrator ID.
            }
        });

        const data = response.data;
        
        return {
            aggregator: "LI.FI",
            transactionData: data.transactionRequest,
            expectedOutput: data.estimate.toAmount,
            gasCostUsd: parseFloat(data.estimate.gasCosts?.[0]?.estimate?.usd || "0"),
            routeData: data
        };
    } catch (error: any) {
        console.error("LI.FI Quote Error:", error?.response?.data || error.message);
        return null;
    }
}
