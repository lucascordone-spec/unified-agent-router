import { getLifiQuote, RouteQuote } from "../services/lifi.service.js";
import { get1inchQuote } from "../services/1inch.service.js";
import { getRangoQuote } from "../services/rango.service.js";

export async function getBestUnifiedRoute(
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    userAddress: string
) {
    const feeWalletAddress = process.env.FEE_WALLET_ADDRESS || "0x8f7670EA615910D0A86320e84A611577F68E3908";

    // Llamamos a los agregadores simultáneamente (en paralelo)
    const promises = [
        getLifiQuote(fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, userAddress, feeWalletAddress),
        getRangoQuote(fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, userAddress, feeWalletAddress),
    ];

    // Si es en la misma cadena, probamos 1inch
    if (fromChainId === toChainId) {
        promises.push(get1inchQuote(fromChainId, fromTokenAddress, toTokenAddress, amount, userAddress, feeWalletAddress));
    }

    const results = await Promise.allSettled(promises);
    
    // Filtrar los que tuvieron exito
    const validQuotes: RouteQuote[] = results
        .filter((r): r is PromiseFulfilledResult<RouteQuote> => r.status === "fulfilled" && r.value !== null)
        .map(r => r.value);

    if (validQuotes.length === 0) {
        throw new Error("No routes found from any aggregator.");
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

    // MVP: Asumimos un volumen arbitrario de $1000 para la demo del dashboard 
    // (En producción, requeriría parsear el precio USD de los tokens)
    const simulatedVolumeUsd = 1000;
    
    // Importamos dinámicamente para evitar problemas de dependencias circulares si las hubiera, 
    // o simplemente usar el import al principio. Vamos a usar import al principio.
    // Wait, let's just require it inline or import at the top. I'll import at the top in a moment.
    // I will use await import to make it easier for this replacement block.
    try {
        const { logRoute } = await import("../db/logger.js");
        logRoute(bestQuote.aggregator, fromTokenAddress, toTokenAddress, simulatedVolumeUsd);
    } catch (e) {
        console.error("Failed to log route", e);
    }

    return {
        bestAggregator: bestQuote.aggregator,
        expectedOutput: bestQuote.expectedOutput,
        transactionData: bestQuote.transactionData,
        feeApplied: "0.02%",
        feeCollector: feeWalletAddress,
        allQuotes: validQuotes.map(q => ({
            aggregator: q.aggregator,
            expectedOutput: q.expectedOutput
        }))
    };
}
