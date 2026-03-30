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

**Also check: Railway CLI**

```bash
railway --version
```

If it's not installed:

```bash
npm install -g @railway/cli
```

Railway CLI is needed for cloud deployment in Step 11. If you're planning to use PM2 locally instead, you can skip this for now.

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

You should see files including `package.json`, `src/`, `ecosystem.config.cjs`, and `railway.json`.

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

Run this to generate a 32-byte hex key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output — it'll look like: `a3f9d2e8b1c047...` (64 hex characters)

Now create your `.env` file:

```bash
cat > .env << 'EOF'
# Wallet encryption key — never share this, never commit it to git
ENCRYPTION_KEY=PASTE_YOUR_KEY_HERE

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

Then open `.env` and replace `PASTE_YOUR_KEY_HERE` with the key you just generated:

```bash
# On Mac/Linux:
nano .env
# or: open -a TextEdit .env
# or: code .env  (if VS Code is installed)
```

Save the file. Your `.env` should now have `ENCRYPTION_KEY` set.

**Important:** This file is listed in `.gitignore` and will never be committed to git. Keep it safe — if you lose this key, you cannot decrypt your wallet file.

---

## STEP 5 — Verify .env Is Correct

Let's confirm the key is in place:

```bash
grep ENCRYPTION_KEY .env
```

You should see `ENCRYPTION_KEY=` followed by your 64-character hex key. If it still says `PASTE_YOUR_KEY_HERE`, go back and edit the file.

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
npx tsx src/index.ts
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
npx tsx src/index.ts
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
npx tsx src/fund-all-chains.ts
```

This script will:
1. Bridge from Ethereum mainnet to MegaETH, Abstract, and Unichain
2. Distribute the bridged ETH proportionally across all 10 wallets on each chain

You'll see transactions printed in real time. Each one is an on-chain transaction — your farming history has already started.

This step takes approximately 5–10 minutes depending on bridge confirmation times.

When it finishes, confirm wallets have balances:

```bash
npx tsx src/check-all-balances.ts
```

You should see non-zero balances for W00–W09 on at least the primary chains.

---

## STEP 10 — Test a Single Farming Run

Before going live, let's do one test run manually to confirm everything works end to end:

```bash
npx tsx src/scheduled-farm.ts --no-jitter
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

**Option A: Railway (cloud, always-on — recommended)**
- Runs even when your computer is off
- Free Railway tier covers it (~$2–3/month of compute)
- Best option for serious long-term farming

**Option B: PM2 local (Mac, Linux, WSL)**
- Runs on your machine
- Pauses if your computer is off
- Fine for casual farming or testing

---

### Option A: Railway Deployment

**1. Log in to Railway:**
```bash
railway login
```
A browser window opens — sign in or create a free account.

**2. Initialise your project:**
```bash
railway init
```
When prompted, choose "Create a new project" and give it a name like `jackson-airdrop-farm`.

**3. Set environment variables in Railway:**
```bash
railway variables set ENCRYPTION_KEY=$(grep ENCRYPTION_KEY .env | cut -d= -f2)
railway variables set TELEGRAM_BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN .env | cut -d= -f2)
railway variables set TELEGRAM_CHAT_ID=$(grep TELEGRAM_CHAT_ID .env | cut -d= -f2)
```

**4. Copy your encrypted wallet file to be included in the deploy:**

Your `data/wallets.enc.json` file contains your encrypted wallets and needs to be deployed with the code. It is safe to include — the keys are encrypted with your ENCRYPTION_KEY. Confirm it exists:
```bash
ls -la data/wallets.enc.json
```

**5. Deploy:**
```bash
railway up
```

Railway will build and deploy. When it says "Deploy succeeded", your farmer is live in the cloud.

**6. Confirm it's running:**
```bash
railway logs
```

You should see log output from the farmer's startup sequence.

Your farm will now fire at 8am, 2pm, and 8pm UTC every day automatically.

---

### Option B: PM2 Local Deployment

```bash
npm run start:pm2
```

This runs `pm2 start ecosystem.config.cjs` and saves the process list.

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
| Check all balances | `npx tsx src/check-all-balances.ts` |
| View activity log | `npx tsx src/index.ts` → option 5 |
| Export wallet addresses | `npx tsx src/index.ts` → option 6 |
| Run farm immediately | `npx tsx src/scheduled-farm.ts --no-jitter` |
| Check PM2 status | `pm2 list` |
| View PM2 logs | `pm2 logs jackson-airdrop-farm --lines 50` |
| Check Railway logs | `railway logs` |

---

## Weekly Maintenance Routine

1. Check Telegram — any failed runs?
2. Run `npx tsx src/check-all-balances.ts` — are wallets above 0.001 ETH each?
3. If low on any chain: top up W00 with ETH and re-run `npx tsx src/fund-all-chains.ts`
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
