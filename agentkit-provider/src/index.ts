import { ActionProvider, CreateAction, Network } from "@coinbase/agentkit";
import { z } from "zod";
import axios from "axios";

// Schema for the get_best_route action
const GetBestRouteSchema = z.object({
    fromChainId: z.number().describe("Source chain ID (e.g. 1 for Ethereum, 42161 for Arbitrum)"),
    toChainId: z.number().describe("Destination chain ID"),
    fromToken: z.string().describe("Source token contract address"),
    toToken: z.string().describe("Destination token contract address"),
    amount: z.string().describe("Amount in smallest unit (e.g. wei for ETH)"),
    userAddress: z.string().describe("Wallet address of the user executing the swap")
});

// The Action Provider class
export class UnifiedRouterActionProvider extends ActionProvider {
    private routerUrl: string;

    constructor(routerUrl: string = "http://localhost:3000") {
        super("unified-router", []);
        this.routerUrl = routerUrl;
    }

    @CreateAction({
        name: "get_best_route",
        description: "Find the best DeFi swap or bridge route by querying 1inch and Rango Exchange simultaneously. Returns optimal route with transaction data ready to sign.",
        schema: GetBestRouteSchema
    })
    async getBestRoute(args: z.infer<typeof GetBestRouteSchema>): Promise<string> {
        try {
            const response = await axios.post(`${this.routerUrl}/route`, args);
            const route = response.data;
            
            return JSON.stringify({
                success: true,
                bestAggregator: route.bestAggregator,
                expectedOutput: route.expectedOutput,
                feeApplied: route.feeApplied,
                transactionData: route.transactionData
            }, null, 2);
        } catch (error: any) {
            return `Error finding route: ${error.message}. Make sure the Unified Router MCP server is running.`;
        }
    }

    // Required: check if this provider supports the given network
    supportsNetwork = (network: Network) => true;
}

export const unifiedRouterActionProvider = (routerUrl?: string) =>
    new UnifiedRouterActionProvider(routerUrl);
