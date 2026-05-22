import { get1inchQuote } from "../services/1inch.service.js";
import { getJupiterQuote } from "../services/jupiter.service.js";
import { getLifiQuote } from "../services/lifi.service.js";



export interface RouteQuote {
    aggregator: string;
    transactionData: any;
    expectedOutput: string;
    gasCostUsd: number;
    routeData: any;
}

export async function getBestUnifiedRoute(
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    userAddress: string
) {
    const feeWalletAddress = process.env.FEE_WALLET_ADDRESS || "0x8f7670EA615910D0A86320e84A611577F68E3908";

    const TIMEOUT_MS = 4000; // 4 seconds timeout for each quote request

    const wrap = <T>(p: Promise<T>) => {
        return Promise.race([
            p,
            new Promise<T>((resolve) => setTimeout(() => resolve(null as any), TIMEOUT_MS))
        ]);
    };

    // Llamamos a los agregadores simultáneamente (en paralelo)
    const promises = [
        wrap(getLifiQuote(fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, userAddress, feeWalletAddress))
    ];
    
    // Jupiter solo si es Solana (111111)
    if (fromChainId === 111111 && toChainId === 111111) {
        promises.push(wrap(getJupiterQuote(fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, userAddress)));
    }

    // Si es en la misma cadena y NO es Solana, probamos 1inch
    if (fromChainId === toChainId && fromChainId !== 111111) {
        promises.push(wrap(get1inchQuote(fromChainId, fromTokenAddress, toTokenAddress, amount, userAddress, feeWalletAddress)));
    }

    const results = await Promise.allSettled(promises);
    
    // Filtrar los que tuvieron exito
    const validQuotes: RouteQuote[] = results
        .filter((r): r is PromiseFulfilledResult<RouteQuote> => r.status === "fulfilled" && r.value !== null)
        .map(r => r.value);

    if (validQuotes.length === 0) {
        throw new Error("No valid routes found across aggregators. Liquidity may be insufficient.");
    }

    // Ordenar por output esperado (descendente) - El que nos da más tokens
    // NOTA: Para una comparación real, se debe normalizar decimales y restar el gasCostUsd, 
    // pero para MVP usamos una comparación simple del output string asumiendo mismos decimales
    validQuotes.sort((a, b) => {
        const outA = BigInt(a.expectedOutput);
        const outB = BigInt(b.expectedOutput);
        if (outA > outB) return -1;
        if (outA < outB) return 1;
        return 0;
    });

    const bestQuote = validQuotes[0];

    // Intentar extraer el volumen en USD real (LI.FI lo provee en data.estimate.fromAmountUSD)
    let realVolumeUsd = 0;
    if (bestQuote.routeData?.estimate?.fromAmountUSD) {
        realVolumeUsd = parseFloat(bestQuote.routeData.estimate.fromAmountUSD);
    }

    try {
        const { logRoute } = await import("../db/logger.js");
        logRoute(bestQuote.aggregator, fromTokenAddress, toTokenAddress, realVolumeUsd, userAddress);
    } catch (e) {
        console.error("Failed to log route", e);
    }

    return {
        bestAggregator: bestQuote.aggregator,
        expectedOutput: bestQuote.expectedOutput,
        gasCostUsd: bestQuote.gasCostUsd,
        transactionData: bestQuote.transactionData,
        feeApplied: "0.02%",
        feeCollector: feeWalletAddress,
        allQuotes: validQuotes.map(q => ({
            aggregator: q.aggregator,
            expectedOutput: q.expectedOutput,
            gasCostUsd: q.gasCostUsd
        }))
    };
}
