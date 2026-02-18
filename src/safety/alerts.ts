import { log } from "../utils/logger.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

const LEVEL_EMOJI: Record<string, string> = {
  info: "\u2139\uFE0F",      // info
  warn: "\u26A0\uFE0F",      // warning
  critical: "\uD83D\uDEA8",  // siren
};

/** Send a Telegram alert from the farmer bot */
export async function sendAlert(
  message: string,
  level: "info" | "warn" | "critical" = "info"
): Promise<void> {
  // Always log locally
  if (level === "critical") {
    log.error(`[SAFETY] ${message}`);
  } else if (level === "warn") {
    log.warn(`[SAFETY] ${message}`);
  } else {
    log.info(`[SAFETY] ${message}`);
  }

  // Send to Telegram if configured
  if (!BOT_TOKEN || !CHAT_ID) return;

  const emoji = LEVEL_EMOJI[level] || "";
  const text = `${emoji} *Airdrop Farmer*\n\n${message}`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      log.warn(`Telegram alert failed (${res.status}): ${err}`);
    }
  } catch (err: unknown) {
    log.warn(`Telegram alert error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Send a farming session summary */
export async function sendSessionSummary(
  totalTasks: number,
  succeeded: number,
  chains: string[],
  totalGasUsd: number
): Promise<void> {
  const lines = [
    `*Farming Run Complete*`,
    ``,
    `Tasks: ${succeeded}/${totalTasks} succeeded`,
    `Chains: ${chains.join(", ")}`,
    `Gas spent: ~$${totalGasUsd.toFixed(4)}`,
  ];
  await sendAlert(lines.join("\n"), succeeded === totalTasks ? "info" : "warn");
}
