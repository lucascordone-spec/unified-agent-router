import { getBestUnifiedRoute } from "./engine/aggregator.js";
import dotenv from "dotenv";

dotenv.config();

async function simulateAgent() {
    console.log("🤖 Iniciando simulación de Agente IA...");
    console.log("Intención: Cambiar 1000 USDC por ETH en Arbitrum (Chain 42161).");

    const fromChainId = 42161; // Arbitrum
    const toChainId = 42161; // Arbitrum
    const usdcAddress = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // USDC
    const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // Native ETH (1inch standard)
    const amount = "1000000000"; // 1000 USDC (6 decimals)
    const userWallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Random user wallet

    try {
        console.log("⏳ Consultando Unified Router (1inch, LIFI, Rango)...");
        const route = await getBestUnifiedRoute(
            fromChainId,
            toChainId,
            usdcAddress,
            ethAddress,
            amount,
            userWallet
        );

        console.log("\n✅ ¡Ruta encontrada con éxito!");
        console.log(`🏆 Mejor Agregador: ${route.bestAggregator}`);
        console.log(`💰 Output Esperado (Wei): ${route.expectedOutput}`);
        console.log(`🧾 Fee Cobrado: ${route.feeApplied} -> Destino: ${route.feeCollector}`);
        console.log("\n📊 Revisa tu Dashboard en http://localhost:3000 para ver los gráficos actualizados.");

    } catch (error) {
        console.error("❌ Error en la simulación:", error);
    }
}

simulateAgent();
