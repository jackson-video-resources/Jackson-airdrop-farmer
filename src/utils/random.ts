/** Random integer between min and max (inclusive) */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float between min and max */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Randomize an amount by ±percentage (e.g. 0.15 = ±15%) */
export function jitterAmount(amount: bigint, pct: number = 0.15): bigint {
  const factor = 1 + (Math.random() * 2 - 1) * pct;
  return BigInt(Math.floor(Number(amount) * factor));
}

/** Sleep for a random duration between min and max milliseconds */
export function randomSleep(minMs: number, maxMs: number): Promise<void> {
  const ms = randInt(minMs, maxMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Shuffle an array (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick N random items from an array */
export function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Random delay description for logging */
export function describeDelay(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}
