import "dotenv/config";
import { runFleetFarming } from "./tasks/executor.js";
import { log } from "./utils/logger.js";

function getArg(name: string, defaultVal: string): string {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : defaultVal;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const sequence = getArg("sequence", "multi-chain-light");
  const walletsArg = getArg("wallets", "");
  const amount = parseFloat(getArg("amount", "0.001"));
  const repeat = parseInt(getArg("repeat", "1"), 10);
  const delayHoursArg = getArg("delay-hours", "2-6");

  const walletIndices = walletsArg
    ? walletsArg.split(",").map((s) => parseInt(s.trim(), 10))
    : undefined;

  const [minHours, maxHours] = delayHoursArg.includes("-")
    ? delayHoursArg.split("-").map(Number)
    : [Number(delayHoursArg), Number(delayHoursArg)];

  log.info("Auto-runner started");
  log.divider();
  log.info(`Sequence:    ${sequence}`);
  log.info(`Wallets:     ${walletIndices ? walletIndices.join(", ") : "all"}`);
  log.info(`Amount:      ${amount} ETH`);
  log.info(`Repeat:      ${repeat} round(s)`);
  log.info(`Delay range: ${minHours}-${maxHours} hours`);
  log.divider();

  for (let i = 1; i <= repeat; i++) {
    log.info(`Starting round ${i}/${repeat}...`);

    try {
      await runFleetFarming(sequence, {
        walletIndices,
        amountEth: amount,
      });
      log.success(`Round ${i}/${repeat} complete.`);
    } catch (err: unknown) {
      log.error(`Round ${i}/${repeat} failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (i < repeat) {
      const delayHours = minHours + Math.random() * (maxHours - minHours);
      const delayMs = delayHours * 60 * 60 * 1000;
      const delayMins = Math.round(delayHours * 60);
      log.info(`Next round in ${delayMins} minutes (${delayHours.toFixed(1)}h)...`);
      await sleep(delayMs);
    }
  }

  log.divider();
  log.success(`All ${repeat} round(s) complete. Auto-runner finished.`);
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
