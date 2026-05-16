import axios from "axios";
import { RouteQuote } from "./lifi.service.js";

const RANGO_API_URL = "https://api.rango.exchange/routing/best-route";

export async function getRangoQuote(
    fromChainId: number,
    toChainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    userAddress: string,
    feeWalletAddress: string
): Promise<RouteQuote | null> {
    try {
        const apiKey = process.env.RANGO_API_KEY;
        if (!apiKey || apiKey === "tu_api_key_de_rango") {
            console.log("Rango API key no configurada, ignorando Rango.");
            return null;
        }

        // Rango permite inyectar fees afiliados (affiliateFee en porcentaje y affiliateRef para el address)
        const response = await axios.post(
            RANGO_API_URL,
            {
                from: { blockchain: getChainName(fromChainId), symbol: fromToken, address: fromToken },
                to: { blockchain: getChainName(toChainId), symbol: toToken, address: toToken },
                amount: amount,
                swapper: {
                    wallet: userAddress
                },
                affiliateRef: feeWalletAddress,
                affiliatePercent: 0.02 // 0.02% Fee
            },
            {
                params: { apiKey }
            }
        );

        const data = response.data;
        if (!data || !data.result || !data.result.outputAmount) return null;

        return {
            aggregator: "Rango",
            transactionData: data.result.tx, // Asumiendo que la ruta devuelve los txs o se requiere un endpoint extra
            expectedOutput: data.result.outputAmount,
            gasCostUsd: parseFloat(data.result.feeUsd || "0"),
            routeData: data
        };
    } catch (error: any) {
        console.error("Rango Quote Error:", error?.response?.data || error.message);
        return null;
    }
}

// Función auxiliar para mapear chainIds a nombres de Rango
function getChainName(chainId: number): string {
    const chainMap: Record<number, string> = {
        1: "ETH",
        56: "BSC",
        137: "POLYGON",
        42161: "ARBITRUM",
        10: "OPTIMISM",
        43114: "AVAX_CCHAIN",
        8453: "BASE"
    };
    return chainMap[chainId] || "UNKNOWN";
}
