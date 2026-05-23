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
  "elizaos-plugin language:TypeScript",
  "eliza-plugin-swap language:TypeScript",
  "eliza-plugin-bridge language:TypeScript",
  // GOAT SDK
  "goat-sdk language:TypeScript",
  "topic:goat-sdk",
  "goat-plugin language:TypeScript",
  // AgentKit
  "coinbase agentkit defi language:TypeScript",
  "topic:agentkit language:TypeScript",
  "agentkit-action language:TypeScript",
  // ETH & L2 Focused
  "defi agent arbitrum swap",
  "base chain ai agent",
  "optimism defi bot",
  "ethereum mainnet swap agent",
  "sonic swap bot",
  "yield farming bot",
  "flash loan arbitrage bot",
  "monad swap bot",
  "berachain bot",
  // High-Volume Target Queries
  "virtuals-protocol language:TypeScript",
  "aixbt language:TypeScript",
  "eliza-trading-bot language:TypeScript",
  "meme-sniper-eliza",
  "zyfai",
  "automated-yield-agent",
  "active-trading-agent",
  "high-frequency-defi-agent"
];

// Keywords that indicate the agent is doing DeFi operations
const DEFI_KEYWORDS = ["swap", "bridge", "trade", "defi", "dex", "liquidity", "token", "cross-chain", "arbitrage", "l2", "ethereum", "leverage", "collateral", "borrow", "lending"];

// ─── PITCH TEMPLATE ──────────────────────────────────────────────────────────

function generatePitch(repoName: string, framework: string): string {
  return `## 🚀 Todo-en-Uno: Más Funciones DeFi, Menos Integración y Monetización Directa para tu Agente

Hi! I came across **${repoName}** and noticed it performs Web3/DeFi operations. We've built a **zero-configuration DeFi toolkit** designed specifically for AI agents that integrates in **under 2 minutes**, allowing your agent to rout swaps and execute leverage safely:

### 1️⃣ [Unified Agent Router](${ROUTER_GITHUB_URL}) — Todo-en-Uno (DEX & Bridge Routing)
* **⚡ Integración en 2 Minutos:** Unifica **1inch**, **Jupiter** y **LI.FI** en un único endpoint. Menos tiempo de desarrollo, más cobertura de cadenas (EVM & Solana).
* **💰 Ganá Plata:** Fee de monetización del **0.02%** integrado que va directo a la billetera de tu agente en cada swap/puente de manera automática.
* **🔌 Zero-Config:** Incluye plugin listo para ElizaOS y Servidor MCP Smithery para Cursor/Claude Desktop.

### 2️⃣ [Enso Collateral Gateway](${COLLATERAL_GITHUB_URL}) — Apalancate y Evitá Liquidaciones
* **⚡ Apalancamiento en 1 Bloque:** Bucle atómico con Flash Loans (Depositar, Swappear, Tomar prestado y Repagar) en una sola transacción sin desplegar smart contracts propios.
* **🛡️ Evitá que te Liquiden:** Permite al agente desarmar o ajustar la posición de colateral al instante para proteger el Health Factor de Aave ante caídas del mercado.
* **🔌 Zero-Config:** Plugin de ElizaOS y herramientas MCP listas para conectar.

---

### 🛠️ Quick Integration (Under 2 Minutes)

If your agent is written in **${framework}** (or standard TypeScript/Node.js), you can integrate either tool instantly:

#### Option A: Direct REST API (Returns Transaction-Ready Calldata)
Get swap/bridge routing (and earn fees):
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

Get atomic flash loan leverage & liquidation protection (Enso Gateway):
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
  notified_live?: boolean;
  responseAuthor?: string;
  responseBody?: string;
  respondedAt?: string;
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

async function checkGitHubResponses(): Promise<void> {
  console.log("\n🔍 Checking existing issues for developer replies...");
  const db = loadDB();
  let updated = false;

  for (const record of db) {
    if (record.status === "issue_opened" && record.issueUrl) {
      const match = record.issueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
      if (!match) continue;
      const [_, owner, repo, issueNumber] = match;

      try {
        const response = await githubApi.get(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`);
        const comments = response.data || [];
        
        // Find if there are comments from other users (not our bot or lucascordone-spec)
        const replies = comments.filter((c: any) => 
          c.user.login.toLowerCase() !== "lucascordone-spec" && 
          !c.body.includes("automated outreach")
        );
        
        if (replies.length > 0) {
          console.log(`\n🎉 [GOOD NEWS] Maintainer reply found on ${record.repo}!`);
          console.log(`   Author: ${replies[0].user.login}`);
          console.log(`   Comment: ${replies[0].body.substring(0, 150)}...`);
          
          record.status = "responded";
          record.responseAuthor = replies[0].user.login;
          record.responseBody = replies[0].body;
          record.respondedAt = replies[0].created_at;
          updated = true;
        }
      } catch (err: any) {
        // Silently catch rate limits or resource not found (e.g. repo deleted)
        if (err.response?.status !== 404 && err.response?.status !== 410) {
          console.log(`   ⚠️ Error checking comments for ${record.repo}: ${err.message}`);
        }
      }
      
      // Delay to avoid rate limiting
      await sleep(1500);
    }
  }

  if (updated) {
    saveDB(db);
  }
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

// Run forever: scan every 30 minutes to catch new agents
async function runForever(): Promise<void> {
  const INTERVAL_MINUTES = 30;
  let round = 1;
  while (true) {
    console.log(`\n🔄 ROUND ${round} — ${new Date().toLocaleString()}`);
    
    // 1. Check for replies first (Lucas wants good news!)
    await checkGitHubResponses();
    
    // 2. Scan and pitch new repos
    await runRecruiter();
    
    console.log(`\n⏳ Sleeping ${INTERVAL_MINUTES}m before next scan...`);
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MINUTES * 60 * 1000));
    round++;
  }
}

runForever().catch(console.error);
