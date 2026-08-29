import "dotenv/config";

// Dynamic import so alerts.ts reads env AFTER dotenv has loaded it.
const { sendAlert, sendSessionSummary } = await import("./safety/alerts.js");

await sendAlert("Setup test: Telegram is wired up correctly.\nFleet: 3 wallets (W00-W02)\nTest chain: Unichain", "info");
await sendSessionSummary(2, 2, ["unichain"], 0.03);
console.log("Both test messages dispatched - check your phone.");
