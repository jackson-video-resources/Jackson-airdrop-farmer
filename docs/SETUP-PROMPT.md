# 🌾 Jackson Airdrop Farm — One-Shot Setup

> Seen in Lewis's tutorial at youtube.com/@LewisJackson
> GitHub: https://github.com/jackson-video-resources/Jackson-airdrop-farmer

---

Hello! Welcome to the **Jackson Airdrop Farm** setup. I'm going to walk you through everything — checking your environment, cloning the repo, generating 10 farming wallets, funding them, and getting your farmer running 24/7.

This should take about **10–15 minutes**. Let's go.

---

## STEP 1 — Check Prerequisites

First, let me check what you've got installed.

Please run the following commands and tell me the output:

```bash
node --version
git --version
```

**What I'm looking for:**
- Node.js: `v20.x.x` or higher
- Git: any version is fine

**If Node.js is missing or below v20:**

- **Mac:** `brew install node` (if you have Homebrew) or download from https://nodejs.org — choose the LTS version
- **Windows WSL / Ubuntu Linux:**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **Other Linux:** use your package manager, or download from nodejs.org — LTS version

After installing, run `node --version` again to confirm it's v20+.

**If Git is missing:**

- **Mac:** `xcode-select --install` (this installs Git and other dev tools)
- **Windows WSL / Ubuntu:** `sudo apt-get install git`
- **Other Linux:** `sudo apt install git` or equivalent

Once `node --version` and `git --version` both return successfully, continue to Step 2.

---

**Also check: PM2** (process manager that keeps the farm running 24/7)

```bash
pm2 --version
```

If it's not installed:

```bash
npm install -g pm2
```

PM2 is what keeps the farm alive on a Hostinger VPS (Step 11) and locally.

---

Perfect! Prerequisites confirmed. Moving on.

---

## STEP 2 — Clone the Repository

Run this command to clone the Jackson Airdrop Farm and move into the project directory:

```bash
git clone https://github.com/jackson-video-resources/Jackson-airdrop-farmer.git jackson-airdrop-farm && cd jackson-airdrop-farm
```

You should now be inside the `jackson-airdrop-farm` folder. Confirm with:

```bash
ls
```

You should see files including `package.json`, `src/`, and `ecosystem.config.cjs`.

---

## STEP 3 — Install Dependencies

```bash
npm install
```

This installs ethers.js, inquirer, chalk, and the other packages the farmer needs. It should take 20–30 seconds.

When it finishes and you see no errors, continue to Step 4.

---

Almost there!

---

## STEP 4 — Generate Encryption Key and Create .env

Your wallet private keys will be stored on disk in an encrypted file. We need to generate a strong encryption key first.

The key does **not** go in `.env`. `.env` lives in the project folder next to
`data/wallets.enc.json`, so anything that copies the folder — a backup, a zip, a
synced directory, an `scp` to a server — would hand over the encrypted wallets
and the key that opens them together. That makes the encryption decorative. The
key lives outside the project instead.

Generate it into its own file, readable only by you:

```bash
mkdir -p ~/.airdrop-farm
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > ~/.airdrop-farm/enc.key
chmod 600 ~/.airdrop-farm/enc.key
```

Now create your `.env` file — no key inside it:

```bash
cat > .env << 'EOF'
# Telegram notifications (fill in after Step 6)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# RPC endpoints (defaults are pre-configured in src/chains/index.ts — these are optional overrides)
# RPC_ETHEREUM=
# RPC_MEGAETH=
# RPC_ABSTRACT=
# RPC_UNICHAIN=
EOF
```

Because the key is no longer in `.env`, every script that touches wallets needs
it supplied explicitly. That is what the `ENCRYPTION_KEY="$(cat ...)"` prefix on
the commands below does — it passes the key to that one command and nothing else.

**Important:** `.env` is listed in `.gitignore` and will never be committed to
git. `~/.airdrop-farm/enc.key` sits outside the repo entirely. Keep it safe — if
you lose that key, you cannot decrypt your wallet file, and the 12-word mnemonic
from Step 7 becomes your only way back in.

---

## STEP 5 — Verify the Key and .env

Confirm the key file is the right length. 65 means 64 hex characters plus a
newline — this prints the count, not the key itself:

```bash
wc -c < ~/.airdrop-farm/enc.key
```

Then confirm the key did **not** end up in `.env`. This should print nothing:

```bash
grep ENCRYPTION_KEY .env
```

If `wc -c` shows anything other than 65, re-run the generate command in Step 4.
If the `grep` prints a line, remove that line from `.env` — the key belongs only
in `~/.airdrop-farm/enc.key`.

---

## STEP 6 — Set Up Telegram Notifications

The farmer sends you a Telegram message after every farming run and for any critical alerts. This takes about 3 minutes.

**Step 6a — Create your bot:**
1. Open Telegram on your phone or at web.telegram.org
2. Search for `@BotFather`
3. Send the message: `/newbot`
4. BotFather asks for a name — type anything, e.g. `My Airdrop Farm`
5. BotFather asks for a username — type something unique ending in `bot`, e.g. `myjacksonfarmerbot`
6. BotFather replies with your **API token** — looks like `7429183054:AAGbK3R...`
7. Copy that token

**Step 6b — Get your Chat ID:**
1. In Telegram, search for `@userinfobot`
2. Send it any message (e.g. `hi`)
3. It replies with your user ID — that number is your Chat ID

**Step 6c — Save to .env:**

Open your `.env` file and fill in both values:

```
TELEGRAM_BOT_TOKEN=7429183054:AAGbK3R...
TELEGRAM_CHAT_ID=123456789
```

Save the file.

**Step 6d — Test it:**

```bash
node -e "
const token = require('dotenv').config().parsed.TELEGRAM_BOT_TOKEN;
const chatId = require('dotenv').config().parsed.TELEGRAM_CHAT_ID;
fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ chat_id: chatId, text: '🌾 Jackson Airdrop Farm connected!' })
}).then(r => r.json()).then(d => console.log(d.ok ? 'Telegram OK!' : JSON.stringify(d)));
"
```

You should get a message in Telegram and `Telegram OK!` in your terminal.

---

## STEP 7 — Generate Your 10 Farming Wallets

Now let's generate the wallet fleet:

```bash
ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/index.ts
```

The interactive menu will appear. Select option **1 — Generate Wallet Fleet** and enter `10` when asked how many wallets.

The system will:
1. Generate a 12-word mnemonic phrase — displayed in **yellow**
2. Derive 10 wallets from that mnemonic
3. Encrypt and save them to `data/wallets.enc.json`

---

### ⚠️ CRITICAL — BACK UP YOUR MNEMONIC PHRASE ⚠️

When the 12-word phrase appears on screen:

**Write it down on paper. Right now. Do not screenshot it. Do not save it in your phone notes.**

This phrase is the master key to all 10 wallets and every airdrop token they will ever earn. If you lose it, you lose access to those tokens. No recovery is possible.

Store the paper somewhere safe. If you're serious about this, use a fireproof box.

---

After the mnemonic, you'll see a list of 10 wallet addresses:

```
  W00  0x1a2b3c4d...
  W01  0x5e6f7a8b...
  W02  0x9c0d1e2f...
  ...
  W09  0x...
```

Exit the menu (option 8 — Exit).

---

## STEP 8 — Fund Wallet W00

**Wallet W00 is your main funding wallet.** All your ETH goes here first, then the system distributes it across chains and wallets automatically.

Run this to display W00's address clearly:

```bash
ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/index.ts
```

Select option **6 — Export Wallet Addresses** and copy the first address (W00).

---

### Send 0.05–0.1 ETH to W00

**From any exchange:**
- Coinbase, Binance, Kraken, Caleb & Brown — it doesn't matter which one
- Go to your exchange's Withdraw or Send page
- Paste the W00 address
- Select **Ethereum Mainnet** as the network
- Amount: **0.05–0.1 ETH**
- Confirm and send

That's it. If you've ever withdrawn crypto from an exchange before, this is the same thing. Network: Ethereum. Amount: 0.05–0.1 ETH.

---

Now let me wait for the ETH to arrive. I'll check the balance every 30 seconds:

```bash
node -e "
import('dotenv/config');
import('./src/chains/index.js').then(({getProvider}) => {
  const provider = getProvider('ethereum');
  const check = async () => {
    try {
      const bal = await provider.getBalance('YOUR_W00_ADDRESS_HERE');
      const eth = Number(bal) / 1e18;
      console.log(new Date().toISOString().slice(11,19) + ' — W00 balance: ' + eth.toFixed(6) + ' ETH');
      if (eth < 0.04) setTimeout(check, 30000);
      else console.log('Funds received! Continuing setup...');
    } catch(e) { console.log('RPC check failed:', e.message); setTimeout(check, 30000); }
  };
  check();
});
"
```

*(Replace `YOUR_W00_ADDRESS_HERE` with the actual W00 address. The script will poll until it sees 0.04 ETH or more.)*

Typical confirmation time: 3–5 minutes on Ethereum mainnet.

---

## STEP 9 — Bridge and Distribute Across Chains

Once ETH is in W00, we need to bridge it to the three farming chains and distribute it across all 10 wallets.

```bash
ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/fund-all-chains.ts
```

This script will:
1. Bridge from Ethereum mainnet to MegaETH, Abstract, and Unichain
2. Distribute the bridged ETH proportionally across all 10 wallets on each chain

You'll see transactions printed in real time. Each one is an on-chain transaction — your farming history has already started.

This step takes approximately 5–10 minutes depending on bridge confirmation times.

When it finishes, confirm wallets have balances:

```bash
ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/check-all-balances.ts
```

You should see non-zero balances for W00–W09 on at least the primary chains.

---

## STEP 10 — Test a Single Farming Run

Before going live, let's do one test run manually to confirm everything works end to end:

```bash
ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/scheduled-farm.ts --no-jitter
```

The `--no-jitter` flag skips the startup randomisation and runs immediately.

You should see:
- Balance check across all wallets
- 1–3 farming targets selected
- Tasks executing (wrap ETH, swap, deploy contract, etc.)
- A success summary: `Scheduled farm complete: X/Y tasks succeeded`
- A Telegram message arriving on your phone

If the Telegram message arrives — everything is working.

---

## STEP 11 — Go Live: Choose Your Deployment Method

How do you want to run the farmer?

**Option A: Hostinger VPS (cloud, always-on — recommended)**
- Runs even when your computer is off
- Cheapest Hostinger KVM plan (~$5/month) covers it — https://hostinger.com/lewisjackson10
- Best option for serious long-term farming

**Option B: PM2 local (Mac, Linux, WSL)**
- Runs on your machine
- Pauses if your computer is off
- Fine for casual farming or testing

---

### Option A: Hostinger VPS Deployment

**1. Get a VPS:**
Grab the cheapest KVM plan at https://hostinger.com/lewisjackson10. Hostinger gives you a server IP and root password.

**2. Connect and install:**

Install Node from NodeSource, not from Ubuntu's own repo. `apt install nodejs`
gives Node 18 on Ubuntu 24.04 — below the version 20 minimum in STEP 1 — and the
farm fails on it:

```bash
ssh root@YOUR_VPS_IP
apt-get update
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
npm install -g pm2 tsx
git clone https://github.com/jackson-video-resources/Jackson-airdrop-farmer.git jackson-airdrop-farm
cd jackson-airdrop-farm && npm install
```

Confirm the version before continuing — anything below v20 will fail later at a
confusing point:

```bash
node --version
```

**3. Put the key on the VPS by itself.** The Step 4 rule matters more on a
rented server: the key must not travel with the wallet file, and must not sit
inside the deploy directory. Paste the key from `~/.airdrop-farm/enc.key` when
prompted — it is not echoed:

```bash
# on the VPS
mkdir -p /root/.airdrop-farm && chmod 700 /root/.airdrop-farm
read -r -s KEY && printf '%s' "$KEY" > /root/.airdrop-farm/enc.key && unset KEY
chmod 400 /root/.airdrop-farm/enc.key
```

**4. Recreate your `.env` on the VPS** with `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, and `NODE_ENV=production` — no `ENCRYPTION_KEY` line.

**5. Copy your encrypted wallet file up to the VPS:**

From your local machine, copy that one file and nothing else:
```bash
scp data/wallets.enc.json root@YOUR_VPS_IP:~/jackson-airdrop-farm/data/
```

Do not `scp -r` the whole project folder — that sweeps up `.env` alongside the
wallet file, which is the pairing this layout exists to prevent. With the key at
`/root/.airdrop-farm/enc.key` (mode `0400`, outside the deploy directory), a
leaked copy of the project folder is not enough to open the wallets.

**6. Start it 24/7:**

`ecosystem.config.cjs` does not read the key file, so pass the key when
registering the process. PM2 captures the environment at start and `pm2 save`
records it for restarts:
```bash
ENCRYPTION_KEY="$(cat /root/.airdrop-farm/enc.key)" pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
```

Run the command `pm2 startup` prints. Your farmer is now live and survives reboots.

**7. Confirm it's running:**
```bash
pm2 logs jackson-airdrop-farm
```

Check the logs before trusting the schedule — a missing key fails at decrypt
time rather than at start time, so the process can look healthy and still not be
farming.

You should see log output from the farmer's startup sequence.

Your farm will now fire at 8am, 2pm, and 8pm UTC every day automatically.

---

### Option B: PM2 Local Deployment

```bash
ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npm run start:pm2
```

This runs `pm2 start ecosystem.config.cjs` and saves the process list. The key
prefix is required — PM2 captures the environment at registration, and without
it every scheduled run fails to decrypt the wallet file.

Confirm it's running:
```bash
pm2 list
```

You should see `jackson-airdrop-farm` listed as `online`.

**To make it survive reboots:**
```bash
pm2 startup
# Run the command it prints (it'll look like: sudo env PATH=... pm2 startup ...)
pm2 save
```

The farmer will now auto-start after a reboot.

**View logs:**
```bash
pm2 logs jackson-airdrop-farm --lines 50
```

---

## Done! Your Farm Is Live.

Your first automatic farming run will fire at the next scheduled time (8am, 2pm, or 8pm UTC — whichever comes first, within the next ~8 hours at most).

When it runs, you'll get a Telegram message like:

```
🌾 Farming Run Complete
Tasks: 5/5 succeeded
Chains: megaeth, abstract, unichain
Transactions logged: 5
```

---

## Quick Reference — Useful Commands

| Task | Command |
|------|---------|
| Check all balances | `ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/check-all-balances.ts` |
| View activity log | `ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/index.ts` → option 5 |
| Export wallet addresses | `ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/index.ts` → option 6 |
| Run farm immediately | `ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/scheduled-farm.ts --no-jitter` |
| Check PM2 status | `pm2 list` |
| View PM2 logs | `pm2 logs jackson-airdrop-farm --lines 50` |
| Restart on the VPS | `pm2 restart jackson-airdrop-farm` |

---

## Weekly Maintenance Routine

1. Check Telegram — any failed runs?
2. Run `ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/check-all-balances.ts` — are wallets above 0.001 ETH each?
3. If low on any chain: top up W00 with ETH and re-run `ENCRYPTION_KEY="$(cat ~/.airdrop-farm/enc.key)" npx tsx src/fund-all-chains.ts`
4. Check if MegaETH, Abstract, or Unichain have announced airdrop dates — increase activity if so

---

## Security Reminders

- Your mnemonic phrase is the only thing that can recover your wallets. Keep it offline.
- Your `.env` file contains your encryption key. Do not commit it to git. Do not share it.
- The farming wallets hold small amounts by design — never send your main holdings here.
- When an airdrop lands, transfer tokens to your main wallet promptly.
- The code is open source: https://github.com/jackson-video-resources/Jackson-airdrop-farmer — read it.

---

Good luck, and happy farming. When the airdrop drops, come back and tell Lewis in the comments.

— *Jackson Airdrop Farm Setup, via youtube.com/@LewisJackson*
