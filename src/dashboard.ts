import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStats } from './db/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/stats', (req, res) => {
    try {
        const stats = getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

app.listen(PORT, () => {
    console.log(`Profit Dashboard running at http://localhost:${PORT}`);
});
