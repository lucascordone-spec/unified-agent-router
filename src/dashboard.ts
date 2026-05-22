import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getStats } from './db/logger.js';
import { getBestUnifiedRoute } from './engine/aggregator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/stats', (req, res) => {
    try {
        const stats = getStats();
        res.json({
            ...stats,
            feeWallet: process.env.FEE_WALLET_ADDRESS || "0x8f7670EA615910D0A86320e84A611577F68E3908"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

app.get('/api/recruiter', (req, res) => {
    try {
        const dbPath = path.join(__dirname, '../recruiter-db.json');
        if (!fs.existsSync(dbPath)) {
            return res.json([]);
        }
        const data = fs.readFileSync(dbPath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to load recruiter data' });
    }
});

app.post('/route', async (req, res) => {
    try {
        const { fromChainId, toChainId, fromToken, toToken, fromTokenAddress, toTokenAddress, amount, userAddress } = req.body;
        
        const srcToken = fromTokenAddress || fromToken;
        const dstToken = toTokenAddress || toToken;
        
        if (!fromChainId || !toChainId || !srcToken || !dstToken || !amount || !userAddress) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const route = await getBestUnifiedRoute(
            Number(fromChainId),
            Number(toChainId),
            srcToken,
            dstToken,
            amount,
            userAddress
        );
        res.json(route);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Profit Dashboard running at http://localhost:${PORT}`);
});
