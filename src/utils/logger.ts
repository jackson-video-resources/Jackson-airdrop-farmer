import chalk from "chalk";

const timestamp = () => new Date().toISOString().slice(11, 19);

export const log = {
  info: (msg: string) => console.log(`${chalk.gray(timestamp())} ${chalk.cyan("INFO")}  ${msg}`),
  success: (msg: string) => console.log(`${chalk.gray(timestamp())} ${chalk.green("OK")}    ${msg}`),
  warn: (msg: string) => console.log(`${chalk.gray(timestamp())} ${chalk.yellow("WARN")}  ${msg}`),
  error: (msg: string) => console.log(`${chalk.gray(timestamp())} ${chalk.red("ERROR")} ${msg}`),
  tx: (hash: string, label: string) =>
    console.log(`${chalk.gray(timestamp())} ${chalk.magenta("TX")}    ${label} ${chalk.gray(hash)}`),
  wallet: (index: number, label: string, msg: string) =>
    console.log(
      `${chalk.gray(timestamp())} ${chalk.blue(`W${String(index).padStart(2, "0")}`)}   ${chalk.white(label)} ${msg}`
    ),
  divider: () => console.log(chalk.gray("─".repeat(60))),
};
