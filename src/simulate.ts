import { getBestUnifiedRoute } from "./engine/aggregator.js";
import dotenv from "dotenv";
import { Wallet } from "ethers";

dotenv.config();

async function runSimulation() {
    console.log("=========================================");
    console.log("🤖 Unified Agent Router - Simulation");
    console.log("=========================================\n");

    const fromChainId = 42161; // Arbitrum
    const toChainId = 42161;   // Arbitrum
    const fromToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ETH
    const toToken = "0xaf88d065e77c8cc2239327c5edb3a432268e5831"; // USDC
    const amount = "10000000000000000"; // 0.01 ETH

    console.log(`[EVM Test]`);
    console.log(`Chain: ${fromChainId}`);
    console.log(`Swapping: 0.01 ETH -> USDC`);
    console.log(`Requesting parallel quotes from LI.FI and 1inch...\n`);

    try {
        // En index.ts el userAddress se deriva, pero aquí llamamos a aggregator.js directamente.
        // Simularemos la misma lógica que usa index.ts
        const pk = process.env.METAMASK_PRIVATE_KEY;
        if (!pk) throw new Error("Missing METAMASK_PRIVATE_KEY");
        const wallet = new Wallet(pk);
        const userAddress = wallet.address;

        console.log(`Autonomous Agent Address Derived: ${userAddress}\n`);

        const start = Date.now();
        const route = await getBestUnifiedRoute(
            fromChainId,
            toChainId,
            fromToken,
            toToken,
            amount,
            userAddress
        );
        const end = Date.now();

        console.log(`✅ Route found in ${end - start}ms!`);
        console.log(`🏆 Best Aggregator: ${route.bestAggregator}`);
        console.log(`💰 Expected Output (USDC Wei): ${route.expectedOutput}`);
        console.log(`🪙 Fee Applied: ${route.feeApplied} to ${route.feeCollector}`);
        
        console.log(`\n📊 All Valid Quotes Retrieved:`);
        route.allQuotes.forEach(q => {
            console.log(` - ${q.aggregator}: ${q.expectedOutput}`);
        });

        console.log(`\n📝 Transaction Payload (Ready to Sign):`);
        console.log(JSON.stringify(route.transactionData, null, 2).substring(0, 300) + "... [Truncated]");

    } catch (e: any) {
        console.error("Simulation failed:", e.message);
    }
}

runSimulation();
