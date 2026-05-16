# @elizaos/plugin-unified-router

A plugin for [ElizaOS](https://github.com/elizaos/eliza) that gives your agent instant access to the best DeFi swap and bridge routes by aggregating **1inch** and **Rango Exchange** simultaneously.

## What it does

When your Eliza agent needs to swap or bridge tokens, instead of relying on a single DEX (and potentially getting a bad price), this plugin:

1. Queries **1inch** and **Rango Exchange** in parallel
2. Compares all quotes mathematically (accounting for gas)
3. Returns the **best route** with ready-to-sign transaction data

## Installation

```bash
elizaos plugins add @elizaos/plugin-unified-router
```

Or install the MCP server directly via Smithery for any MCP-compatible agent:

```bash
npx @smithery/cli install @lucascordone-spec/unified-agent-router --client claude
```

## Configuration

Add to your character file:

```json
{
  "plugins": ["@elizaos/plugin-unified-router"],
  "settings": {
    "UNIFIED_ROUTER_URL": "http://localhost:3000"
  }
}
```

## Usage

Your agent will automatically handle swap/bridge intents:

- *"Swap 1000 USDC to ETH on Arbitrum"*
- *"Bridge my tokens from Optimism to Base"*
- *"Find the best price for WBTC → USDC"*

## Supported Networks

Any chain supported by 1inch or Rango Exchange:
- Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BSC and more.

## License

MIT
