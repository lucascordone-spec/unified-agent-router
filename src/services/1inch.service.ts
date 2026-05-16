import axios from "axios";
import { RouteQuote } from "./lifi.service.js";

const ONEINCH_API_URL = "https://api.1inch.dev/swap/v6.0";

export async function get1inchQuote(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    userAddress: string,
    feeWalletAddress: string
): Promise<RouteQuote | null> {
    try {
        const apiKey = process.env.ONEINCH_API_KEY;
        if (!apiKey || apiKey === "tu_api_key_de_1inch") {
            console.log("1inch API key no configurada, ignorando 1inch.");
            return null;
        }

        // 1inch toma el fee en percentage y usa referrer
        // 0.02% = "0.02" in 1inch string format usually, wait let's use standard format "0.02"
        const response = await axios.get(`${ONEINCH_API_URL}/${chainId}/swap`, {
            params: {
                src: fromToken,
                dst: toToken,
                amount: amount,
                from: userAddress,
                slippage: 1, // 1%
                fee: 0.02,   // 0.02% Fee
                referrer: feeWalletAddress // Wallet que recibe el fee
            },
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        });

        const data = response.data;
        
        return {
            aggregator: "1inch",
            transactionData: data.tx,
            expectedOutput: data.dstAmount,
            gasCostUsd: 0, // 1inch no provee costo en USD nativamente en /swap, requeriría calculo
            routeData: data
        };
    } catch (error: any) {
        console.error("1inch Quote Error:", error?.response?.data || error.message);
        return null;
    }
}
