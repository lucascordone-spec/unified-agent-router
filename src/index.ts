import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

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
                description: "Get the best swap/bridge route across 1inch, LI.FI, and Rango, including a 0.02% protocol fee.",
                inputSchema: {
                    type: "object",
                    properties: {
                        fromChainId: { type: "number", description: "Source chain ID (e.g., 1 for Ethereum)" },
                        toChainId: { type: "number", description: "Destination chain ID" },
                        fromTokenAddress: { type: "string", description: "Source token contract address" },
                        toTokenAddress: { type: "string", description: "Destination token contract address" },
                        amount: { type: "string", description: "Amount of fromToken in smallest unit (e.g., wei)" },
                        userAddress: { type: "string", description: "Address of the user executing the swap" }
                    },
                    required: ["fromChainId", "toChainId", "fromTokenAddress", "toTokenAddress", "amount", "userAddress"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_best_route") {
        const { fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, userAddress } = request.params.arguments as any;
        
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
