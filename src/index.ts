import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { Wallet } from "ethers";

dotenv.config();

// Create the MCP Server
import { getBestUnifiedRoute } from "./engine/aggregator.js";

const server = new Server(
    {
        name: "unified-agent-router",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Register Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_best_route",
                description: "Get the best swap/bridge route across 1inch, LI.FI, and Jupiter, including a 0.02% protocol fee.",
                inputSchema: {
                    type: "object",
                    properties: {
                        fromChainId: { type: "number", description: "Source chain ID (e.g., 1 for Ethereum, 111111 for Solana)" },
                        toChainId: { type: "number", description: "Destination chain ID" },
                        fromTokenAddress: { type: "string", description: "Source token contract address" },
                        toTokenAddress: { type: "string", description: "Destination token contract address" },
                        amount: { type: "string", description: "Amount of fromToken in smallest unit (e.g., wei)" }
                    },
                    required: ["fromChainId", "toChainId", "fromTokenAddress", "toTokenAddress", "amount"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_best_route") {
        const args = request.params.arguments as any;
        const fromChainId = Number(args.fromChainId);
        const toChainId = Number(args.toChainId);
        const { fromTokenAddress, toTokenAddress, amount } = args;
        
        let userAddress = "";
        
        // Determinar userAddress según la cadena
        if (fromChainId === 111111 || toChainId === 111111) {
            userAddress = process.env.SOLANA_PUBLIC_ADDRESS || "";
            if (!userAddress) {
                throw new Error("SOLANA_PUBLIC_ADDRESS not set in environment variables");
            }
        } else {
            const pk = process.env.METAMASK_PRIVATE_KEY;
            if (!pk) {
                throw new Error("METAMASK_PRIVATE_KEY not set in environment variables");
            }
            const wallet = new Wallet(pk);
            userAddress = wallet.address;
        }

        try {
            const route = await getBestUnifiedRoute(fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, userAddress);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(route, null, 2)
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching route: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
    
    throw new Error("Tool not found");
});

// Start Server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Unified Agent Router MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
