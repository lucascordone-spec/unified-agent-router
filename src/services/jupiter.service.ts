import axios from "axios";
import { RouteQuote } from "./types.js";

const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap";

export async function getJupiterQuote(
    fromChainId: number,
    toChainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    userAddress: string
): Promise<RouteQuote | null> {
    // Jupiter solo soporta Solana. Asumimos 111111 como chainId de Solana
    if (fromChainId !== 111111 || toChainId !== 111111) {
        return null;
    }

    try {
        if (!userAddress) {
            console.warn("SOLANA_PUBLIC_ADDRESS is missing. Jupiter needs a public key for the swap transaction.");
            return null;
        }

        // 1. Get quote
        const quoteResponse = await axios.get(JUPITER_QUOTE_URL, {
            params: {
                inputMint: fromToken,
                outputMint: toToken,
                amount: amount,
                slippageBps: 100 // 1%
            }
        });

        const quoteData = quoteResponse.data;
        if (!quoteData || !quoteData.outAmount) return null;

        // 2. Get swap transaction (base64 encoded transaction)
        let transactionData = null;
        try {
            const swapResponse = await axios.post(JUPITER_SWAP_URL, {
                quoteResponse: quoteData,
                userPublicKey: userAddress,
                wrapAndUnwrapSol: true
                // Para cobrar fees en Jupiter, se requiere configuración de cuentas de fee por token,
                // omitimos el feeCollector directo por simplicidad técnica en este punto.
            });
            transactionData = swapResponse.data.swapTransaction;
        } catch (swapError: any) {
            console.error("Jupiter Swap Tx Error:", swapError?.response?.data || swapError.message);
        }

        return {
            aggregator: "Jupiter",
            transactionData,
            expectedOutput: quoteData.outAmount,
            gasCostUsd: 0, // Jupiter es Solana, gas usualmente muy bajo (<0.01$)
            routeData: quoteData
        };
    } catch (error: any) {
        console.error("Jupiter Quote Error:", error?.response?.data || error.message);
        return null;
    }
}
