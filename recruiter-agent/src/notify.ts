import "dotenv/config";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../recruiter-db.json");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function saveDB(records: any[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2));
}

const MESSAGE = `🚀 **UPDATE: We are now LIVE and fully functional!**

You no longer need to install any local packages. Our centralized API is up and running. You can get optimal DeFi routes immediately by sending a POST request to:
\`https://little-earwig-99.loca.lt/route\`

Check the previous message for the payload format. Let us know if you integrate it!`;

async function notifyAll() {
    console.log("🚀 STARTING MASS NOTIFICATION CAMPAIGN");
    const db = loadDB();
    
    let notifiedCount = 0;
    
    for (const record of db) {
        if (record.status === "issue_opened" && record.issueUrl && !record.notified_live) {
            console.log(`Notifying ${record.repo}...`);
            // Extract owner, repo, issue_number from URL
            // Example: https://github.com/owner/repo/issues/1
            const match = record.issueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
            if (match) {
                const [_, owner, repo, issueNumber] = match;
                try {
                    await githubApi.post(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
                        body: MESSAGE
                    });
                    console.log(`   ✅ Comment posted on #${issueNumber}`);
                    record.notified_live = true;
                    notifiedCount++;
                    saveDB(db);
                    
                    // Rate limit protection
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e: any) {
                    console.error(`   ❌ Failed to comment on ${record.repo}:`, e.message);
                }
            }
        }
    }
    
    console.log(`\n🎉 Campaign finished. Notified ${notifiedCount} agents.`);
}

notifyAll().catch(console.error);
