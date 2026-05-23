/**
 * UNIFIED ROUTER - RECRUITER AGENT
 * ================================
 * Autonomous agent that scans GitHub for DeFi AI agents,
 * analyzes their tech stack, and pitches our unified router.
 * 
 * Strategy:
 * 1. Search GitHub for repos using Eliza, GOAT, AgentKit
 * 2. Filter for active DeFi agents (swaps, bridges, trading)
 * 3. Open a customized Issue on each target repo
 * 4. Track all outreach in a local database
 */

import "dotenv/config";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../recruiter-db.json");

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const ROUTER_GITHUB_URL = "https://github.com/lucascordone-spec/unified-agent-router";
const COLLATERAL_GITHUB_URL = "https://github.com/lucascordone-spec/enso-collateral-api";

// Delay between API calls to avoid rate limiting (ms)
const DELAY_MS = 3000;

// ─── TARGET FRAMEWORKS ───────────────────────────────────────────────────────

// Repository search queries — broad and effective
const TARGET_QUERIES = [
  // Milady AI & Ecosystem (High Priority)
  "org:milady-ai",
  "milady ai agent",
  "topic:milady-ai",
  // ElizaOS ecosystem
  "topic:elizaos language:TypeScript",
  "topic:eliza-plugin language:TypeScript",
  "eliza defi swap language:TypeScript",
  // GOAT SDK
  "goat-sdk language:TypeScript",
  "topic:goat-sdk",
  // AgentKit
  "coinbase agentkit defi language:TypeScript",
  "topic:agentkit language:TypeScript",
  // ETH & L2 Focused
  "defi agent arbitrum swap",
  "base chain ai agent",
  "optimism defi bot",
  "ethereum mainnet swap agent",
];

// Keywords that indicate the agent is doing DeFi operations
const DEFI_KEYWORDS = ["swap", "bridge", "trade", "defi", "dex", "liquidity", "token", "cross-chain", "arbitrage", "l2", "ethereum", "leverage", "collateral", "borrow", "lending"];

// ─── PITCH TEMPLATE ──────────────────────────────────────────────────────────

function generatePitch(repoName: string, framework: string): string {
  return `## 🚀 Supercharge your agent with Universal DeFi Routing & Collateral Leverage (100% Fast to Integrate)

Hi! I came across **${repoName}** and noticed it performs DeFi operations. I wanted to share our suite of **zero-configuration DeFi tools** built specifically for AI agents that take **under 2 minutes to integrate** and can significantly improve transaction efficiency, route prices, and gas costs for your users:

### 1️⃣ [Unified Agent Router](${ROUTER_GITHUB_URL}) (DEX & Bridge Routing)
Exposes optimal swap/bridge routing across **1inch**, **Jupiter**, and **LI.FI** in parallel (EVM & Solana).
* **⚡ Parallel Route Optimization:** Compares quotes under 4 seconds.
* **🌐 Cross-Chain Bridges:** Seamlessly bridge assets across 14+ chains.
* **💰 Protocol Monetization:** Standard 0.02% fee built-in for agent operators.
* **🔌 Zero-Config ElizaOS Plugin & Smithery MCP Server.**

### 2️⃣ [Enso Collateral Gateway](${COLLATERAL_GITHUB_URL}) (Atomic Collateral Leverage)
Enables agents to build and dismantle leveraged yield/lending positions (Aave V3) atomically using **Flash Loans** without deploying contracts.
* **⚡ Atomic Flash Loan Loop:** Borrow, Swap, Deposit, and Repay in a single block.
* **💰 Custom Monetization:** Standard 0.1% fee built-in.
* **🔌 Pre-built ElizaOS plugin & MCP tool ready to run.**

---

### 🛠️ Quick Integration (Under 2 Minutes)

If your agent is written in **${framework}** (or standard TypeScript/Node.js), you can integrate either tool instantly:

#### Option A: Direct REST API (Returns Transaction-Ready Calldata)
Get swap/bridge routing:
\`\`\`bash
curl -X POST http://localhost:3000/route \\
  -H "Content-Type: application/json" \\
  -d '{
    "fromChainId": 42161,
    "toChainId": 42161,
    "fromTokenAddress": "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    "toTokenAddress": "0x82af49447d8a07e3bd95bd0d56f352415231caa1",
    "amount": "100000000",
    "userAddress": "YOUR_WALLET_ADDRESS"
  }'
\`\`\`

Get atomic flash loan leverage (Enso Gateway):
\`\`\`bash
curl -X POST http://localhost:3001/api/v1/build-collateral \\
  -H "Content-Type: application/json" \\
  -d '{
    "chainId": 42161,
    "userAddress": "YOUR_WALLET_ADDRESS",
    "tokenToDeposit": "0x82af49447d8a07e3bd95bd0d56f352415231caa1",
    "tokenToBorrow": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    "amount": "1000000000000000000",
    "leverageMultiplier": 3
  }'
\`\`\`

#### Option B: Zero-Config MCP Tool (Cursor/Claude Desktop/Windsurf)
Add the server configurations directly to your Agent Client to give it instant access to both tools:
\`\`\`json
{
  "mcpServers": {
    "unified-agent-router": {
      "command": "node",
      "args": ["/path/to/unified-agent-router/dist/index.js"]
    },
    "enso-collateral": {
      "command": "node",
      "args": ["/path/to/enso-collateral-api/packages/mcp-server/dist/index.js"]
    }
  }
}
\`\`\`

---

Happy to assist with the integration or help customize the fees for your team. Would this be useful for **${repoName}**?

---
*This is an automated outreach from the LCF IA Finanzas project. If this is not relevant, feel free to close this issue.*`;
}

// ─── DATABASE ─────────────────────────────────────────────────────────────────

interface OutreachRecord {
  repo: string;
  url: string;
  framework: string;
  issueUrl?: string;
  status: "pending" | "issue_opened" | "responded" | "error";
  timestamp: string;
}

function loadDB(): OutreachRecord[] {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function saveDB(records: OutreachRecord[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2));
}

function alreadyContacted(records: OutreachRecord[], repo: string): boolean {
  return records.some(r => r.repo === repo);
}

// ─── GITHUB API ───────────────────────────────────────────────────────────────

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchRepos(query: string): Promise<any[]> {
  try {
    const response = await githubApi.get("/search/repositories", {
      params: { q: query + " pushed:>2025-01-01", per_page: 10, sort: "updated" },
    });
    // Return items shaped like code search items (with repository embedded)
    return (response.data.items || []).map((repo: any) => ({
      repository: repo,
      path: repo.name,
    }));
  } catch (err: any) {
    if (err.response?.status === 403) {
      console.log("⚠️  Rate limit hit. Waiting 60 seconds...");
      await sleep(60000);
    }
    console.log(`   ⚠️  Search error: ${err.response?.status} ${err.response?.data?.message}`);
    return [];
  }
}

async function openIssue(owner: string, repo: string, framework: string): Promise<string | null> {
  try {
    const response = await githubApi.post(`/repos/${owner}/${repo}/issues`, {
      title: `[Tool Suggestion] Unified DeFi Router — better swap/bridge routes for your agent`,
      body: generatePitch(`${owner}/${repo}`, framework),
      labels: [],
    });
    return response.data.html_url;
  } catch (err: any) {
    // Issues may be disabled on this repo
    if (err.response?.status === 410 || err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────

function detectFramework(item: any): string {
  const content = (item.path || "").toLowerCase();
  const repoName = (item.repository?.full_name || "").toLowerCase();
  
  if (content.includes("elizaos") || repoName.includes("eliza")) return "ElizaOS";
  if (content.includes("goat-sdk") || repoName.includes("goat")) return "GOAT SDK";
  if (content.includes("agentkit") || repoName.includes("agentkit")) return "Coinbase AgentKit";
  return "AI Agent Framework";
}

function isRelevantRepo(item: any): boolean {
  const repoName = (item.repository?.full_name || "").toLowerCase();
  const description = (item.repository?.description || "").toLowerCase();
  const topics: string[] = (item.repository?.topics || []).map((t: string) => t.toLowerCase());
  const combined = repoName + " " + description + " " + topics.join(" ");
  
  // Skip our own repo
  if (repoName.includes("unified-agent-router")) return false;
  // Skip tutorial/example/fork repos with no DeFi signal
  if ((repoName.includes("tutorial") || repoName.includes("example") || repoName.includes("template")) && 
      !DEFI_KEYWORDS.some(kw => combined.includes(kw))) return false;
  // Accept if topics contain DeFi signals
  if (topics.some(t => DEFI_KEYWORDS.includes(t))) return true;
  if (topics.some(t => ["elizaos","eliza-plugin","goat-sdk","agentkit","mcp-server"].includes(t))) return true;
  // Accept if name or description has DeFi keywords
  return DEFI_KEYWORDS.some(kw => combined.includes(kw));
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────

async function runRecruiter(): Promise<void> {
  console.log("🤖 UNIFIED ROUTER RECRUITER AGENT STARTED");
  console.log("==========================================\n");

  const db = loadDB();
  let totalIssuesOpened = 0;
  let totalScanned = 0;

  for (const query of TARGET_QUERIES) {
    console.log(`\n🔍 Scanning: "${query.substring(0, 60)}..."`);
    
    const items = await searchRepos(query);
    console.log(`   Found ${items.length} results`);

    for (const item of items) {
      const repo = item.repository?.full_name;
      if (!repo) continue;

      totalScanned++;

      // Skip if already contacted
      if (alreadyContacted(db, repo)) {
        console.log(`   ⏭️  Already contacted: ${repo}`);
        continue;
      }

      // Skip if not relevant
      if (!isRelevantRepo(item)) {
        console.log(`   ❌ Not relevant: ${repo}`);
        continue;
      }

      const framework = detectFramework(item);
      const [owner, repoName] = repo.split("/");

      console.log(`\n   🎯 Target found: ${repo} [${framework}]`);
      console.log(`      URL: ${item.repository?.html_url}`);

      const record: OutreachRecord = {
        repo,
        url: item.repository?.html_url || "",
        framework,
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      try {
        const issueUrl = await openIssue(owner, repoName, framework);
        
        if (issueUrl) {
          record.status = "issue_opened";
          record.issueUrl = issueUrl;
          totalIssuesOpened++;
          console.log(`   ✅ Issue opened: ${issueUrl}`);
        } else {
          record.status = "error";
          console.log(`   ⚠️  Issues disabled on ${repo}`);
        }
      } catch (err: any) {
        record.status = "error";
        console.log(`   ❌ Error opening issue: ${err.message}`);
      }

      db.push(record);
      saveDB(db);

      // Delay to avoid rate limiting
      await sleep(DELAY_MS);
    }

    // Delay between query batches
    await sleep(DELAY_MS * 2);
  }

  // ─── FINAL REPORT ─────────────────────────────────────────────────────────
  console.log("\n==========================================");
  console.log("📊 RECRUITER AGENT REPORT");
  console.log("==========================================");
  console.log(`  Repos scanned:      ${totalScanned}`);
  console.log(`  Issues opened:      ${totalIssuesOpened}`);
  console.log(`  Already contacted:  ${db.filter(r => r.status === "issue_opened").length} total`);
  console.log(`  Database saved at:  ${DB_PATH}`);
  console.log("==========================================\n");
}

// ─── ENTRYPOINT ───────────────────────────────────────────────────────────────

if (!GITHUB_TOKEN) {
  console.error("❌ ERROR: GITHUB_TOKEN not set in environment.");
  console.error("   Create one at: https://github.com/settings/tokens");
  console.error("   Required scope: public_repo");
  process.exit(1);
}

// Run forever: scan every 6 hours to catch new agents
async function runForever(): Promise<void> {
  const INTERVAL_HOURS = 6;
  let round = 1;
  while (true) {
    console.log(`\n🔄 ROUND ${round} — ${new Date().toLocaleString()}`);
    await runRecruiter();
    console.log(`\n⏳ Sleeping ${INTERVAL_HOURS}h before next scan...`);
    await new Promise(resolve => setTimeout(resolve, INTERVAL_HOURS * 60 * 60 * 1000));
    round++;
  }
}

runForever().catch(console.error);
