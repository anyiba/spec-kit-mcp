import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, "build", "index.js");
const serverProcess = spawn("node", [serverPath], {
    stdio: ["pipe", "pipe", "inherit"],
});

const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
};

serverProcess.stdin.write(JSON.stringify(request) + "\n");

serverProcess.stdout.on("data", (data) => {
    console.log("Received:", data.toString());
    serverProcess.kill();
});

serverProcess.on("error", (err) => {
    console.error("Failed to start server:", err);
});
