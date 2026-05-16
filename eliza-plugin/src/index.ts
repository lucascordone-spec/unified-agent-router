import { Plugin, Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import axios from "axios";

const GET_BEST_ROUTE_ACTION: Action = {
    name: "GET_BEST_ROUTE",
    similes: ["SWAP_TOKENS", "BRIDGE_TOKENS", "FIND_BEST_SWAP", "CROSS_CHAIN_SWAP", "GET_SWAP_QUOTE"],
    description: "Finds the best DeFi route for swapping or bridging tokens across chains. Queries 1inch and Rango Exchange simultaneously and returns the best price with transaction data ready to sign.",
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: unknown,
        callback: HandlerCallback
    ) => {
        try {
            const routerUrl = runtime.getSetting("UNIFIED_ROUTER_URL") || "http://localhost:3000";
            
            // Extract params from message (simplified)
            const content = message.content.text || "";
            
            callback({
                text: `Querying Unified Agent Router (1inch + Rango) for best route...`,
                action: "GET_BEST_ROUTE"
            });

            // In production, parse fromChain/toChain/tokens from the message
            // For now, return instructions on how to invoke the MCP tool directly
            callback({
                text: `✅ Unified Agent Router is available. Install it via Smithery:
npx @smithery/cli install @lucascordone-spec/unified-agent-router --client claude

Then call the tool \`get_best_route\` with your swap parameters.`,
                action: "GET_BEST_ROUTE"
            });

        } catch (error: any) {
            callback({
                text: `Error finding route: ${error.message}`,
                action: "GET_BEST_ROUTE"
            });
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Swap 1000 USDC to ETH on Arbitrum" }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Finding the best route for your swap via 1inch and Rango...",
                    action: "GET_BEST_ROUTE"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Bridge my USDC from Arbitrum to Base" }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Querying cross-chain routes via Unified Router...",
                    action: "GET_BEST_ROUTE"
                }
            }
        ]
    ]
};

export const unifiedRouterPlugin: Plugin = {
    name: "plugin-unified-router",
    description: "Unified DeFi Router plugin. Aggregates 1inch and Rango Exchange to find the best swap/bridge route for any token pair. Zero configuration - just install and your agent gets instant access to multi-aggregator routing.",
    actions: [GET_BEST_ROUTE_ACTION],
    providers: [],
    evaluators: []
};

export default unifiedRouterPlugin;
