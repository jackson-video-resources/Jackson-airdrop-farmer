import type { WalletPersonality } from "./types.js";
import { randFloat, randInt, pickRandom } from "../utils/random.js";

const ALL_L2_CHAINS = ["base", "scroll", "linea", "zksync"];

/** Weighted chain selection — not all wallets use all chains */
function pickPreferredChains(): string[] {
  const count = randInt(2, 4);
  return pickRandom(ALL_L2_CHAINS, count);
}

/** Generate a unique behavioral profile for a wallet */
export function generatePersonality(walletIndex: number): WalletPersonality {
  // Each wallet gets consistent but unique behavioral patterns
  return {
    speedFactor: randFloat(0.6, 2.0),
    preferredChains: pickPreferredChains(),
    amountJitter: randFloat(0.08, 0.25),
    activeHoursStart: randInt(6, 14),
    activeHoursEnd: randInt(18, 23),
  };
}

/** Check if the current UTC hour falls within the wallet's active window */
export function shouldBeActive(personality: WalletPersonality): boolean {
  const hour = new Date().getUTCHours();
  return hour >= personality.activeHoursStart && hour < personality.activeHoursEnd;
}

/** Apply personality speed factor to a base delay range, returning a delay in ms */
export function getDelay(
  personality: WalletPersonality,
  baseMinMs: number,
  baseMaxMs: number
): number {
  const min = Math.round(baseMinMs * personality.speedFactor);
  const max = Math.round(baseMaxMs * personality.speedFactor);
  return randInt(min, max);
}
