import dotenv from "dotenv";
import { ethers } from "ethers";
import axios from "axios";

dotenv.config();

// ─── CONFIGURATION ───────────────────────────────────────────────────────────

const RPC_OPTIMISM = process.env.RPC_OPTIMISM || "https://mainnet.optimism.io";
const PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;
const FEE_WALLET = process.env.FEE_WALLET_ADDRESS || "0x8f7670EA615910D0A86320e84A611577F68E3908";

// Set to true to actually execute the arbitrage swaps on-chain
const EXECUTE_ARBITRAGE = process.env.EXECUTE_ARBITRAGE === "true";
const SCAN_INTERVAL_MS = 15000; // Scan every 15 seconds

// Optimism Tokens Address Registry
const TOKENS = {
  WETH: { address: "0x4200000000000000000000000000000000000006", decimals: 18, symbol: "WETH" },
  USDC: { address: "0x0b2c639c53a0c3128f997a7bab533e06aee6587c", decimals: 6, symbol: "USDC" },
  OP:   { address: "0x4200000000000000000000000000000000000042", decimals: 18, symbol: "OP" },
  USDT: { address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", decimals: 6, symbol: "USDT" },
  DAI:  { address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", decimals: 18, symbol: "DAI" }
};

// Triangular Arbitrage Paths to Scan
const ARBITRAGE_PATHS = [
  [TOKENS.USDC, TOKENS.OP, TOKENS.WETH],   // USDC -> OP -> WETH -> USDC
  [TOKENS.USDC, TOKENS.WETH, TOKENS.OP],   // USDC -> WETH -> OP -> USDC
  [TOKENS.WETH, TOKENS.OP, TOKENS.USDC],   // WETH -> OP -> USDC -> WETH
  [TOKENS.WETH, TOKENS.USDC, TOKENS.OP],   // WETH -> USDC -> OP -> WETH
  [TOKENS.USDC, TOKENS.USDT, TOKENS.OP],   // USDC -> USDT -> OP -> USDC
  [TOKENS.USDC, TOKENS.DAI, TOKENS.WETH]    // USDC -> DAI -> WETH -> USDC
];

// Initial capital sizes to simulate
const INITIAL_AMOUNTS = {
  USDC: "10000000",   // 10 USDC
  WETH: "5000000000000000" // 0.005 WETH (approx $15)
};

// Standard ERC20 ABI for Balance & Allowance checks
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// 1inch API configuration
const ONEINCH_BASE_URL = "https://api.1inch.dev/swap/v6.0/10"; // Chain ID 10 is Optimism

const httpClient = axios.create({
  headers: {
    Authorization: `Bearer ${ONEINCH_API_KEY}`,
    Accept: "application/json"
  }
});

// ─── INITIALIZATION ──────────────────────────────────────────────────────────

if (!PRIVATE_KEY) {
  console.error("❌ Error: METAMASK_PRIVATE_KEY not set in .env.");
  process.exit(1);
}

if (!ONEINCH_API_KEY) {
  console.error("❌ Error: ONEINCH_API_KEY not set in .env.");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_OPTIMISM);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log(`🤖 OPTIMISM TRIANGULAR ARBITRAGE BOT INITIALIZED`);
console.log(`=================================================`);
console.log(`Address:          ${wallet.address}`);
console.log(`Execution Mode:   ${EXECUTE_ARBITRAGE ? "⚠️ LIVE EXECUTION" : "🔬 SIMULATION MODE (Safe)"}`);
console.log(`Scan Interval:    ${SCAN_INTERVAL_MS / 1000}s`);
console.log(`=================================================\n`);

// Helper to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── CORE ARBITRAGE LOGIC ────────────────────────────────────────────────────

/**
 * Queries 1inch API for a single swap step quote/txdata
 */
async function fetch1inchSwap(
  fromToken: string,
  toToken: string,
  amount: string
): Promise<{ expectedOutput: string; txData: any } | null> {
  try {
    const response = await httpClient.get(`${ONEINCH_BASE_URL}/swap`, {
      params: {
        src: fromToken,
        dst: toToken,
        amount: amount,
        from: wallet.address,
        slippage: 0.5, // 0.5% slippage to minimize loss
        disableEstimate: "true", // Disable simulation since we don't have intermediate balances yet
        referrer: FEE_WALLET
      }
    });

    return {
      expectedOutput: response.data.dstAmount,
      txData: response.data.tx
    };
  } catch (err: any) {
    const status = err.response?.status;
    const details = err.response?.data?.description || err.message;
    // Log rate limit warnings explicitly
    if (status === 429) {
      console.warn("   ⚠️ 1inch API Rate Limit hit. Please use a premium Key.");
    } else {
      // Quiet fail to avoid spamming logs during active scans
      // console.debug(`Quote fetch failed for ${fromToken} -> ${toToken}: ${details}`);
    }
    return null;
  }
}

/**
 * Checks and approves token allowance if needed
 */
async function checkAndApproveAllowance(
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint
): Promise<void> {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const allowance: bigint = await tokenContract.allowance(wallet.address, spenderAddress);
  
  if (allowance < amount) {
    console.log(`🔑 Approving token ${tokenAddress} for spender ${spenderAddress}...`);
    const tx = await tokenContract.approve(spenderAddress, ethers.MaxUint256);
    console.log(`   Waiting for approval tx: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Approved!`);
  }
}

/**
 * Scans a single triangular path
 */
async function scanPath(path: any[]): Promise<void> {
  const startToken = path[0];
  const startSymbol = startToken.symbol;
  
  // Decide initial amount
  const initialAmountRaw = startSymbol === "USDC" ? INITIAL_AMOUNTS.USDC : INITIAL_AMOUNTS.WETH;
  
  // 1. Hop 1: Token A -> Token B
  const hop1 = await fetch1inchSwap(path[0].address, path[1].address, initialAmountRaw);
  if (!hop1) return;
  await sleep(1500); // 1.5s delay to stay within 1inch free tier limits (1 RPS approx)

  // 2. Hop 2: Token B -> Token C
  const hop2 = await fetch1inchSwap(path[1].address, path[2].address, hop1.expectedOutput);
  if (!hop2) return;
  await sleep(1500);

  // 3. Hop 3: Token C -> Token A
  const hop3 = await fetch1inchSwap(path[2].address, path[0].address, hop2.expectedOutput);
  if (!hop3) return;

  // Calculate Profit
  const startVal = BigInt(initialAmountRaw);
  const endVal = BigInt(hop3.expectedOutput);
  const profitVal = endVal - startVal;

  const startFormatted = ethers.formatUnits(startVal, startToken.decimals);
  const endFormatted = ethers.formatUnits(endVal, startToken.decimals);
  const profitFormatted = ethers.formatUnits(profitVal, startToken.decimals);

  const pathString = `${path[0].symbol} ➔ ${path[1].symbol} ➔ ${path[2].symbol} ➔ ${path[0].symbol}`;

  if (profitVal > 0n) {
    console.log(`\n✨ [PROFITABLE PATH FOUND]`);
    console.log(`   Path:    ${pathString}`);
    console.log(`   Input:   ${startFormatted} ${startSymbol}`);
    console.log(`   Output:  ${endFormatted} ${startSymbol}`);
    console.log(`   Profit:  +${profitFormatted} ${startSymbol}`);
    
    // Check if profit covers gas (Est. 3 swaps on Optimism cost ~0.0001 ETH, about $0.30 USD)
    const minProfitUsdThreshold = 0.50; // $0.50 USD threshold
    const isWethStart = startSymbol === "WETH";
    const profitUsd = isWethStart 
      ? parseFloat(profitFormatted) * 3000 // Approximate WETH price
      : parseFloat(profitFormatted); // USDC is pegged to $1

    console.log(`   Est. Profit (USD): ~$${profitUsd.toFixed(4)}`);

    if (profitUsd > minProfitUsdThreshold) {
      console.log(`   🔥 Profit exceeds threshold ($${minProfitUsdThreshold})!`);
      
      if (EXECUTE_ARBITRAGE) {
        console.log(`   🚀 EXECUTION TRIGGERED! Executing sequential swaps...`);
        try {
          // Hop 1 execution
          await checkAndApproveAllowance(path[0].address, hop1.txData.to, startVal);
          console.log(`   [Hop 1] Swapping ${path[0].symbol} -> ${path[1].symbol}...`);
          const tx1 = await wallet.sendTransaction({
            to: hop1.txData.to,
            data: hop1.txData.data,
            value: hop1.txData.value,
            gasLimit: 300000
          });
          await tx1.wait();
          console.log(`      ✅ Hop 1 Success: ${tx1.hash}`);

          // Hop 2 execution (requires getting the actual balance of token B after swap)
          const tokenBContract = new ethers.Contract(path[1].address, ERC20_ABI, wallet);
          const balanceB: bigint = await tokenBContract.balanceOf(wallet.address);
          
          await checkAndApproveAllowance(path[1].address, hop2.txData.to, balanceB);
          console.log(`   [Hop 2] Swapping ${path[1].symbol} -> ${path[2].symbol}...`);
          
          // Re-fetch hop 2 with actual balance to ensure transaction doesn't fail
          const freshHop2 = await fetch1inchSwap(path[1].address, path[2].address, balanceB.toString());
          if (freshHop2) {
            const tx2 = await wallet.sendTransaction({
              to: freshHop2.txData.to,
              data: freshHop2.txData.data,
              value: freshHop2.txData.value,
              gasLimit: 300000
            });
            await tx2.wait();
            console.log(`      ✅ Hop 2 Success: ${tx2.hash}`);
          }

          // Hop 3 execution
          const tokenCContract = new ethers.Contract(path[2].address, ERC20_ABI, wallet);
          const balanceC: bigint = await tokenCContract.balanceOf(wallet.address);
          
          await checkAndApproveAllowance(path[2].address, hop3.txData.to, balanceC);
          console.log(`   [Hop 3] Swapping ${path[2].symbol} -> ${path[0].symbol}...`);
          
          const freshHop3 = await fetch1inchSwap(path[2].address, path[0].address, balanceC.toString());
          if (freshHop3) {
            const tx3 = await wallet.sendTransaction({
              to: freshHop3.txData.to,
              data: freshHop3.txData.data,
              value: freshHop3.txData.value,
              gasLimit: 300000
            });
            await tx3.wait();
            console.log(`      ✅ Hop 3 Success! Arbitrage execution complete: ${tx3.hash}`);
          }
        } catch (execErr: any) {
          console.error(`   ❌ Arbitrage execution failed:`, execErr.message);
        }
      } else {
        console.log(`   ℹ️ [Simulation] Skipping live transaction execution.`);
      }
    } else {
      console.log(`   ⚠️ Profit too small to cover estimated gas/slippage. Skipping.`);
    }
  } else {
    // Console log scanning state for visual feedback
    process.stdout.write(`.` );
  }
}

/**
 * Main loop running the scanner
 */
async function startScanner(): Promise<void> {
  let cycle = 1;
  while (true) {
    const timeStr = new Date().toLocaleTimeString();
    console.log(`\n\n🔍 [CYCLE ${cycle} — ${timeStr}] Scanning paths on Optimism...`);
    
    // Check wallet gas balance
    try {
      const balanceWei = await provider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balanceWei);
      console.log(`   Wallet Gas Balance: ${parseFloat(balanceEth).toFixed(5)} ETH`);
      
      if (balanceWei < ethers.parseEther("0.0005")) {
        console.warn(`   ⚠️ Warning: Low gas balance! Active execution may fail.`);
      }
    } catch (e: any) {
      console.warn("   ⚠️ Could not read wallet gas balance:", e.message);
    }

    for (const path of ARBITRAGE_PATHS) {
      await scanPath(path);
      await sleep(1500); // Wait between path scans to respect rate limits
    }
    
    cycle++;
    await sleep(SCAN_INTERVAL_MS);
  }
}

startScanner().catch((e) => {
  console.error("FATAL: Scanner loop crashed:", e);
});
