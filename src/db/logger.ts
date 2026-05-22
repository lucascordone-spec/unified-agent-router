import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../db.json');

export interface RouteLog {
    timestamp: string;
    aggregator: string;
    fromToken: string;
    toToken: string;
    volumeUsd: number;
    projectedProfitUsd: number;
    userAddress: string;
}

export interface DashboardStats {
    totalVolumeUsd: number;
    totalProfitUsd: number;
    routesGenerated: number;
    logs: RouteLog[];
}

function initDb() {
    if (!fs.existsSync(DB_PATH)) {
        const initialStats: DashboardStats = {
            totalVolumeUsd: 0,
            totalProfitUsd: 0,
            routesGenerated: 0,
            logs: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialStats, null, 2));
    }
}

let isWriting = false;
const writeQueue: Array<() => void> = [];

function acquireLock(): Promise<void> {
    if (!isWriting) {
        isWriting = true;
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        writeQueue.push(resolve);
    });
}

function releaseLock() {
    if (writeQueue.length > 0) {
        const next = writeQueue.shift();
        if (next) {
            next();
            return;
        }
    }
    isWriting = false;
}

export async function logRoute(aggregator: string, fromToken: string, toToken: string, volumeUsd: number, userAddress: string) {
    await acquireLock();
    try {
        initDb();
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const stats: DashboardStats = JSON.parse(data);

        const projectedProfitUsd = volumeUsd * 0.0002; // 0.02%

        const newLog: RouteLog = {
            timestamp: new Date().toISOString(),
            aggregator,
            fromToken,
            toToken,
            volumeUsd,
            projectedProfitUsd,
            userAddress
        };

        stats.logs.push(newLog);
        stats.totalVolumeUsd += volumeUsd;
        stats.totalProfitUsd += projectedProfitUsd;
        stats.routesGenerated += 1;

        fs.writeFileSync(DB_PATH, JSON.stringify(stats, null, 2));
    } finally {
        releaseLock();
    }
}

export function getStats(): DashboardStats {
    initDb();
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}
