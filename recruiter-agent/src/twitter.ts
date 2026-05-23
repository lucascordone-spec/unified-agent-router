import "dotenv/config";
import axios from "axios";

// Configuración de API de Twitter (X)
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const COMPANY_TWITTER_HANDLE = "@lucasiacor";

/**
 * Obtiene métricas agregadas de ambos servidores locales
 */
async function fetchAggregatedMetrics() {
    let routerVolume = 0;
    let routerFees = 0;
    let activeAgents = 0;

    let ensoVolume = 0;
    let ensoFees = 0;
    let ensoAgents = 0;

    // 1. Obtener stats de Unified Agent Router (Puerto 3000)
    try {
        const response = await axios.get("http://localhost:3000/api/stats");
        if (response.data) {
            routerVolume = response.data.totalVolume || 0;
            routerFees = response.data.totalFees || 0;
            activeAgents = response.data.activeAgents || 0;
        }
    } catch (e: any) {
        console.warn("⚠️  No se pudieron obtener métricas de Unified Agent Router (Puerto 3000)");
    }

    // 2. Obtener stats de Enso Collateral Gateway (Puerto 3001)
    try {
        const response = await axios.get("http://localhost:3001/api/v1/metrics");
        if (response.data) {
            ensoVolume = response.data.totalVolume || 0;
            ensoFees = response.data.totalFees || 0;
            ensoAgents = response.data.activeAgents || 0;
        }
    } catch (e: any) {
        console.warn("⚠️  No se pudieron obtener métricas de Enso Collateral Gateway (Puerto 3001)");
    }

    return {
        totalVolume: routerVolume + ensoVolume,
        totalFees: routerFees + ensoFees,
        totalAgents: Math.max(activeAgents, ensoAgents)
    };
}

/**
 * Genera el texto del tweet en base a las estadísticas reales
 */
async function generateTweetText() {
    const metrics = await fetchAggregatedMetrics();
    
    return `🤖 LCF IA Finanzas | DeFi Agent Suite Diagnostic Report:

⚡ Total Volume: $${metrics.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
💰 Escrow Profits (Fees): $${metrics.totalFees.toFixed(2)} USD
🔌 Active Agent Nodes: ${metrics.totalAgents}

Our gateways are fully functional, providing 2-minute integrations for swaps, cross-chain bridges, and collateral flash loan leverage.

Integrate now: https://github.com/lucascordone-spec/unified-agent-router
Cc ${COMPANY_TWITTER_HANDLE}`;
}

/**
 * Publica el tweet en Twitter/X usando las credenciales configuradas
 */
export async function postTwitterUpdate() {
    console.log("🐦 INICIANDO CAMPAÑA DE PUBLICACIÓN EN TWITTER (X)");
    
    const tweetText = await generateTweetText();
    console.log("\n📝 Tweet generado para enviar:\n------------------------------------");
    console.log(tweetText);
    console.log("------------------------------------\n");

    const hasCreds = TWITTER_API_KEY && TWITTER_API_SECRET && TWITTER_ACCESS_TOKEN && TWITTER_ACCESS_TOKEN_SECRET;

    if (!hasCreds) {
        console.warn("⚠️  Twitter API credentials are not set in .env. Skipping actual post.");
        console.info("   To enable real tweets, configure: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET");
        return;
    }

    try {
        // En producción, llamar a la API de Twitter usando la firma OAuth 1.0a
        // O importando 'twitter-api-v2' si está instalada.
        // Simulamos la llamada mediante axios para demostrar la interacción real
        console.log(`🚀 Enviando tweet oficial en representación de ${COMPANY_TWITTER_HANDLE}...`);
        
        // Cargar dinámicamente la SDK de Twitter si está instalada o hacer un post OAuth 1.0a
        // Para este script rápido de marketing, dejamos el esqueleto listo:
        /*
        const { TwitterApi } = await import("twitter-api-v2");
        const client = new TwitterApi({
            appKey: TWITTER_API_KEY!,
            appSecret: TWITTER_API_SECRET!,
            accessToken: TWITTER_ACCESS_TOKEN!,
            accessSecret: TWITTER_ACCESS_TOKEN_SECRET!,
        });
        await client.v2.tweet(tweetText);
        console.log("✅ Tweet publicado exitosamente en Twitter (X)!");
        */
       console.log("✅ [Simulación] Tweet preparado y listo para enviar en producción.");
    } catch (error: any) {
        console.error("❌ Falló la publicación del tweet en Twitter:", error.message);
    }
}

// Permitir ejecución directa del script
if (process.argv[1]?.endsWith("twitter.js") || process.argv[1]?.endsWith("twitter.ts")) {
    postTwitterUpdate().catch(console.error);
}
