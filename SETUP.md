# One-Shot Setup Prompt

**How to use:**
1. Click the **copy button** (top-right corner of the box below)
2. Open your terminal and run: `claude` (or `claude --dangerously-skip-permissions` to skip confirmations)
3. Paste and press Enter

Claude Code will set up the entire farm automatically — 10–20 minutes, no manual steps.

---

~~~~
Hello Claude Code. I need your help setting up the Jackson Airdrop Farm. This is a 10-wallet automated airdrop farming system that runs 3x per day across MegaETH, Abstract, and Unichain — the three chains most likely to airdrop tokens in 2025/26.

Please follow these steps in order, carefully. If any step fails, diagnose the error and fix it before continuing — do not skip steps. Show me clear progress updates after each step completes.

---

## STEP 1 — Check Prerequisites

Please check whether the following tools are installed and at the correct versions. Run each check and report the result clearly.

**Check 1: Node.js**
Run: `node --version`

- If Node.js is version 20 or higher: good, continue.
- If Node.js is below version 20 or missing:
  - Mac: Tell me to run `brew install node` (and if Homebrew isn't installed: `curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash`)
  - Linux/WSL: Tell me to run `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
  - Windows (without WSL): Tell me to download Node.js 20 LTS from nodejs.org, then re-open this terminal and paste this prompt again.
  - Wait for me to confirm Node is updated before continuing.

**Check 2: Git**
Run: `git --version`

- If Git is missing:
  - Mac: `brew install git`
  - Linux/WSL: `sudo apt-get install -y git`
  - Windows: Tell me to download Git for Windows from git-scm.com.
  - Wait for confirmation before continuing.

**Check 3: Railway CLI**
Run: `railway --version`

- If Railway CLI is missing: run `npm install -g @railway/cli`
- If that fails with a permissions error on Mac/Linux: run `sudo npm install -g @railway/cli`
- Confirm it's installed before continuing.

Once all three checks pass, print:

```
✅ Prerequisites verified:
   Node.js: [version]
   Git: [version]
   Railway CLI: [version]

   Ready to set up Jackson Airdrop Farm.
```

---

## STEP 2 — Clone the Repository

Run:

```bash
git clone https://github.com/jackson-video-resources/Jackson-airdrop-farmer.git jackson-airdrop-farm
cd jackson-airdrop-farm
```

If the clone fails (network error, repository not found), tell me clearly what the error is.

Once complete, print:

```
✅ Repository cloned to: jackson-airdrop-farm/
```

---

## STEP 3 — Install Dependencies

Run:

```bash
npm install
```

This installs ethers.js, TypeScript, and all other dependencies. It should take 30–60 seconds.

If it fails:
- Check for Node.js version issues first (`node --version` — must be 20+)
- If there's a permission error: try `sudo npm install`
- If there's a network error: try `npm install --registry https://registry.npmjs.org`

Once complete, print:

```
✅ Dependencies installed successfully.
```

---

## STEP 4 — Generate Encryption Key & Configure Environment

Before generating wallets, we need an encryption key. This encrypts your wallet private keys at rest — it never leaves your machine.

Run this to generate a secure random key AND create the .env file in one step:

```bash
ENCKEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") && cat > .env << ENVEOF
ENCRYPTION_KEY=$ENCKEY
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ENVEOF
```

Verify the .env file looks correct (key should be 64 hex characters):

```bash
head -2 .env
```

Once complete, print:

```
✅ Encryption key generated and saved to .env
   (64-character hex key — never share this or commit it to Git)
```

---

## STEP 5 — Generate 10 Wallets

Run the wallet generator:

```bash
npx tsx src/index.ts
```

When the interactive menu appears, select option **1 — Generate Wallet Fleet**.

When asked "How many wallets?", enter **10** (or press Enter to accept the default).

Wait for the wallets to generate. Print the output clearly, including all 10 wallet addresses (W00 through W09).

After showing the output, print this message prominently:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 CRITICAL: BACK UP YOUR MNEMONIC PHRASE RIGHT NOW

The 12 words shown above are the master key to all 10
wallets. Write them down on paper. Store them somewhere
safe and offline. If you lose them, you lose access to
every airdrop token these wallets earn.

DO NOT:
  ✗ Screenshot it
  ✗ Paste it into any website
  ✗ Send it to anyone (including Claude)
  ✗ Store it only in a notes app

DO:
  ✓ Write it on paper
  ✓ Store in a fireproof safe if you have one
  ✓ Make a second paper copy kept elsewhere
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then ask me: **"Have you written down your mnemonic phrase and stored it safely? Type YES to continue."**

Wait for my YES before proceeding.

---

## STEP 6 — Display Funding Instructions

Display W00's address (the first wallet, index 0) very clearly:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FUND YOUR MAIN WALLET (W00)

Send ETH to this address:

  [W00 ADDRESS HERE]

Instructions:
  • Amount: 0.05 ETH minimum, 0.1 ETH recommended
  • Network: Ethereum Mainnet (NOT BSC, NOT Polygon)
  • From: Any exchange (Coinbase, Binance, Kraken,
    Caleb & Brown, Bybit — anything that lets you
    withdraw ETH)

Steps on most exchanges:
  1. Go to Withdraw / Send
  2. Select ETH
  3. Select network: Ethereum (ERC-20)
  4. Paste the address above
  5. Amount: 0.05–0.1 ETH
  6. Confirm and send

Confirmation usually takes 3–5 minutes.
Check: https://etherscan.io — search the address above.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask me: **"Have you sent ETH to W00 and has it arrived? Type YES when confirmed."**

Wait for my YES before proceeding.

---

## STEP 7 — Bridge & Distribute ETH Across Chains

Now bridge from W00 on Ethereum mainnet to the farming chains, then distribute to all 10 wallets.

**Step 7a — Fund all chains from W00:**

```bash
npx tsx src/fund-all-chains.ts
```

This bridges ETH from W00 to MegaETH, Abstract, and Unichain. Watch the output and report what happens. If a bridge fails or an RPC is unreachable, note it but continue with the chains that work.

**Step 7b — Distribute to all wallets:**

```bash
npx tsx src/distribute-wallets.ts
```

This sends ETH from W00 to W01–W09 on each chain. Watch the transaction output and report: how many transfers were sent and how much ETH was distributed per chain.

If the distribution script reports "too low balance" on a chain, that bridge may not have landed yet. Wait 2 minutes and try again.

Once both steps complete, run the balance checker:

```bash
npx tsx src/check-all-balances.ts
```

Report the results: which wallets have balances on which chains.

Print:

```
✅ ETH distributed across farming wallets.
   W01–W09 are funded and ready to farm.
```

---

## STEP 8 — Set Up Telegram Notifications

Your farmer sends a Telegram message after every farming run. This step connects it to your phone.

Print these instructions clearly:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 SET UP TELEGRAM (2-MINUTE PROCESS)

STEP A — Create your bot:
  1. Open Telegram on your phone
  2. Search for @BotFather
  3. Send it: /newbot
  4. Choose a name (e.g. "My Airdrop Farmer")
  5. Choose a username (must end in "bot")
  6. BotFather gives you a token like: 7891234567:AAHxyz...
  7. Copy that token — that's your BOT_TOKEN

STEP B — Get your Chat ID:
  1. Search Telegram for @userinfobot
  2. Send it: /start
  3. It replies with your ID number (e.g. 123456789)
  4. That's your CHAT_ID

STEP C — Tell me both values below.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask me: **"Please share your Telegram BOT_TOKEN and CHAT_ID."**

Wait for me to provide both values.

Once I give them, update the .env file using sed or Python to replace the empty TELEGRAM_BOT_TOKEN= and TELEGRAM_CHAT_ID= lines with the values I provided.

Then send a test message to confirm it works:

```bash
node -e "
require('dotenv/config');
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    chat_id: chatId,
    text: '🌾 *Jackson Airdrop Farm* — Setup complete! Your farmer is ready.',
    parse_mode: 'Markdown'
  })
}).then(r => r.json()).then(d => console.log(d.ok ? '✅ Telegram connected!' : '❌ Error: ' + JSON.stringify(d)));
"
```

If the test message fails:
- Is the BOT_TOKEN correct (numbers, colon, then letters)?
- Is the CHAT_ID correct (just numbers)?
- Did you send /start to the bot from Telegram yet?

---

## STEP 9 — Deploy to Railway (Cloud Hosting)

This makes your farmer run 24/7 in the cloud, even when your computer is off.

**Step 9a — Create a Railway account (if you don't have one):**

Tell the user: "First, create a free Railway account here: https://railway.com?referralCode=BLrK89 — come back when you've signed up."

Wait for them to confirm before continuing.

**Step 9b — Log in to Railway:**

```bash
railway login
```

This opens a browser window. Log in with GitHub or email. Come back when done.

If Railway login fails or you prefer local hosting, tell me and I'll switch to the PM2 setup instead.

**Step 9b — Create a Railway project:**

```bash
railway init
```

When prompted for a project name, use: `jackson-airdrop-farm`

**Step 9c — Set environment variables:**

```bash
railway variables set ENCRYPTION_KEY="$(grep ENCRYPTION_KEY .env | cut -d= -f2)"
railway variables set TELEGRAM_BOT_TOKEN="$(grep TELEGRAM_BOT_TOKEN .env | cut -d= -f2)"
railway variables set TELEGRAM_CHAT_ID="$(grep TELEGRAM_CHAT_ID .env | cut -d= -f2)"
railway variables set NODE_ENV=production
WALLET_DATA=$(base64 < data/wallets.enc.json | tr -d '\n')
railway variables set WALLET_DATA_B64="$WALLET_DATA"
```

**Step 9d — Deploy:**

```bash
railway up -d
```

Watch the output. This takes 1–3 minutes.

If the deployment fails, run `railway logs` and report what you see.

Once deployed, print:

```
✅ Deployed to Railway successfully.
   Your farmer will run automatically at:
     8:00 AM UTC
     2:00 PM UTC
     8:00 PM UTC

   Check status anytime: railway logs
```

---

## STEP 9 (ALTERNATIVE) — Run Locally with PM2

If Railway isn't working or you prefer your own machine:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```

Run the command that `pm2 startup` outputs (it will start with `sudo env PATH=...`).

Then verify:
```bash
pm2 list
pm2 logs jackson-airdrop-farm --lines 20
```

Print:

```
✅ PM2 running locally.
   Farmer scheduled for: 8am, 2pm, 8pm UTC
   Check status: pm2 list
   View logs: pm2 logs jackson-airdrop-farm
```

---

## STEP 10 — Test Run & Final Confirmation

Let's do a manual test run to confirm everything works end to end.

Run:

```bash
npx tsx src/scheduled-farm.ts
```

Watch the output. It should:
1. Load your wallets
2. Check balances across all chains
3. Select wallet/chain combinations
4. Execute tasks (wraps, swaps, deploys)
5. Send a Telegram summary

Report what happened: how many tasks ran, which chains were farmed, and whether the Telegram message arrived.

If the run finds no funded wallets, the bridge/distribution in Step 7 may not have settled yet. Wait 5 minutes and try again.

Once you've confirmed at least one successful task, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌾 JACKSON AIRDROP FARM IS RUNNING

Your 10 wallets are now farming MegaETH, Abstract,
and Unichain automatically, 3x per day.

WHAT HAPPENS NEXT:
  • Every 8 hours, your wallets execute random on-chain
    transactions (swaps, wraps, contract deploys)
  • You'll get a Telegram message after each run
  • Over the next 3–6 months, this builds the on-chain
    history that qualifies for airdrops

TO CHECK IN:
  • Telegram: watch for farming summaries
  • Balances: npx tsx src/check-all-balances.ts
  • Logs (Railway): railway logs
  • Logs (PM2): pm2 logs jackson-airdrop-farm

SECURITY REMINDERS:
  ✓ Mnemonic phrase backed up offline
  ✓ .env file NOT committed to Git
  ✓ Farming wallets hold only farming amounts

QUESTIONS OR ISSUES:
  YouTube: https://youtube.com/@lewisjackson
  GitHub: https://github.com/jackson-video-resources/Jackson-airdrop-farmer

Good luck with the airdrops. 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Finally, print this message:

```
⭐ One last thing — if this saved you time, a star on
   GitHub takes 5 seconds and helps other people find it:

   https://github.com/jackson-video-resources/Jackson-airdrop-farmer

   Click ⭐ Star in the top-right corner of that page.
   It genuinely makes a difference — thank you!
```

Setup is complete.
~~~~
