# "I Built an AI Airdrop Farmer That Runs 24/7 (Full Setup Tutorial)"
## Complete Video Outline — Jackson Airdrop Farm

**Total runtime target:** 50–55 minutes
**Format:** Masterclass / screen-recorded tutorial. Lewis talks to camera at open and close. All technical sections are screen-recorded with voiceover.
**Audience:** Crypto-curious, some technical. Has heard of airdrops, may not know how to set up anything more complex than a MetaMask wallet.

---

## SECTION 1 — HOOK & INTRO [0:00–3:00] (3 min)
**Format:** Talking head, camera

### What Lewis shows:
- Phone screen: Telegram notifications coming in from the farmer bot, timestamped through the night
- Terminal window (30 seconds of fast-forward) showing farming activity across multiple wallets

### Key talking points:
- "While I was sleeping last night, this system made 47 on-chain transactions across 10 wallets, on three different blockchains. I didn't touch my computer once."
- Tease the punchline: "There's a $500M airdrop window open right now and almost nobody is farming it correctly."
- "This video is a complete setup tutorial. By the end you'll have 10 wallets running automatically, farming the chains most likely to airdrop tokens in 2026. And I'm going to give you a file at the end that sets up almost the entire thing with one paste into your terminal."
- Brief credential: "I'm Lewis, I've been building crypto tools for two years and I've personally collected from Arbitrum, zkSync, and Abstract airdrops — this system is how I scaled that up."
- **[FEEDBACK #3]** Tease the profit mechanics now so viewers stay: "I'll show you exactly how airdrops work and what a realistic return looks like — including the full cost breakdown and the math."

---

## SECTION 2 — WHAT IS AN AIRDROP? (PROFIT MECHANICS) [3:00–9:00] (6 min)
**Format:** Screen share — browser, simple diagrams, and real airdrop examples

### [FEEDBACK #3 — Full treatment here]

### What Lewis shows:
- Arbitrum airdrop announcement page / ARB token chart at launch
- zkSync airdrop criteria list
- Abstract chain "upcoming airdrop" community announcement page
- Simple diagram (draw on screen or use Keynote): User interacts with chain → Chain logs wallet history → Airdrop day: snapshot → eligible wallets get tokens → tokens worth real money

### Key talking points:
- **How airdrops work in plain English:** "New blockchain networks want users. Before they release their own token, they want thousands of wallets doing real transactions on their chain — so it looks busy and attracts investors. On airdrop day, they take a snapshot of every wallet that used the chain and give them free tokens proportional to how active they were."
- **The three metrics every chain cares about:**
  1. Transaction count — how many times you interacted
  2. Contract diversity — did you use multiple protocols (DEX swaps, lending, bridges, contract deploys)?
  3. Time span — were you active over months, not just one burst in a single week?
- **Real numbers:** "Arbitrum airdrop — average eligible wallet received around $2,000–$4,000 worth of ARB. zkSync — average around $800. The outliers who had 10 wallets and 6 months of activity collected $15,000–$40,000 from a single airdrop."
- **The three chains we're targeting right now and why:**
  - **MegaETH:** Backed by Vitalik Buterin, fully EVM-compatible, sub-millisecond block times, no token yet. Very early activity window — most people have never heard of it.
  - **Abstract:** Backed by Pudgy Penguins team and major VCs, consumer-focused L2, no token yet. Strong NFT and gaming angle — high-profile enough to do a large airdrop.
  - **Unichain:** The official Uniswap L2 chain. Uniswap has never done a dedicated L2 airdrop — this could be the biggest one yet.
- **What this system does:** "10 wallets, each doing wrap/unwrap/swap/deploy sequences randomly so they look human. 3 times a day, automatically. For months. We're targeting all three chains simultaneously."

### Math breakdown (show as on-screen callout):
```
One chain, conservative zkSync-level payout:
  $500 per wallet × 10 wallets = $5,000

One chain, Arbitrum-level payout:
  $2,000 per wallet × 10 wallets = $20,000

Gas cost to generate 6 months of activity:
  ~$5–8/month × 6 months = $30–$50 total

Risk: No airdrop happens → you spent ~$50
Upside: One mid-tier airdrop → $5,000–$20,000
```
- "That's asymmetric. That's why people farm."
- "This is not guaranteed. Airdrops can exclude wallets, underperform, or not happen. But the expected value math on farming three pre-token chains simultaneously is one of the best asymmetric bets in crypto right now."

---

## SECTION 3 — COSTS, PREREQUISITES & WHAT YOU NEED [9:00–14:00] (5 min)
**Format:** Talking head into screen share

### [FEEDBACK #2 — Full upfront cost treatment here]

### Upfront costs (show as clean on-screen list):

**One-time setup costs:**
| Item | Cost |
|------|------|
| ETH to fund farming wallets | 0.05–0.1 ETH (~$130–$260) |
| Railway cloud hosting | Free tier works; paid plan $5/month for always-on |
| Your time | 15 minutes for the one-shot setup |

**Ongoing costs:**
| Item | Cost |
|------|------|
| Gas fees across all 10 wallets | ~$5–8/month at current L2 prices |
| Railway (optional paid tier) | $5/month |

**Total to get started seriously: ~$150–$280 one time + ~$5–8/month**

- "You do not need a powerful computer. This runs on a laptop, a cheap VPS, or Railway's cloud. It uses almost no CPU — it's just sending transactions."
- "You do not need to leave your computer on. I'll show you Railway deployment in Section 7 — your farmer runs in the cloud even when your machine is off."

### Prerequisites list (show on screen):
1. **Node.js v20 or higher** — the lead magnet setup checks this automatically and provides install commands if it's missing
2. **Claude Code** — free tier works. This is the AI terminal that runs the one-shot setup file
3. **Git** — Mac and Linux: almost certainly already installed. Windows: comes bundled with Git for Windows
4. **Railway CLI** — for cloud deployment. The setup file installs this if it's missing
5. **A crypto exchange account** — Coinbase, Binance, Kraken, Caleb & Brown — anything where you can buy ETH and send it to an address

### [FEEDBACK #1 — Platform coverage]
- "This tutorial works on **Mac**, **Windows with WSL2**, and any **Linux VPS**."
- **Mac:** Everything works natively in Terminal. Nothing special required.
- **Windows:** "Open PowerShell as Administrator and run `wsl --install`. Restart your machine. Open Ubuntu from the Start Menu. Everything in this tutorial from here runs inside that Ubuntu terminal — identical to Linux."
- **Linux VPS:** "If you want a machine you never have to babysit, rent a $4/month Hetzner or DigitalOcean VPS. SSH in, run the setup file — done."
- "I'll call out Windows WSL differences wherever they exist. There aren't many."

---

## SECTION 4 — ARCHITECTURE OVERVIEW [14:00–18:00] (4 min)
**Format:** Screen share — code editor (VS Code or similar) + simple flow diagram

### What Lewis shows:
- The repo folder structure (`src/`, `data/`, `logs/`, `docs/`, `scripts/`)
- `src/scheduled-farm.ts` open — briefly walk the main function: check balances, pick targets, run tasks, send Telegram summary
- `ecosystem.config.cjs` — show the cron schedule: `0 8,14,20 * * *` = 8am, 2pm, 8pm UTC
- `src/chains/index.ts` — quickly scroll through: 9 chains configured with their RPCs and chain IDs
- `src/safety/` folder — point to it: "entire security module. I'll cover this properly in Section 8."
- `data/wallets.enc.json` — "this file doesn't exist yet. The setup creates it. Your private keys are encrypted inside it."

### Key talking points:
- "Here's the system at a high level. 10 wallets stored in an encrypted JSON file. The scheduler runs 3 times a day using a cron job. Each run: checks balances across all chains, picks 1–3 wallet/chain combinations at random, runs a sequence of tasks — wraps, swaps, contract deploys, Aave deposits — then sends you a Telegram summary."
- "The randomness is deliberate. Each wallet has what I call a 'personality' — different active hours, different amounts, different timing between transactions. They're designed to look like 10 different humans, not a bot running in a loop."
- "The safety module is layered underneath everything. Every transaction is pre-validated before it goes on-chain. I'll show you exactly what it does in the security section."
- Show the Telegram notification format: `Farming Run Complete — Tasks: 5/5 succeeded — Chains: megaeth, abstract, unichain`

### Chain strategy:
- "We farm 9 chains. Primary airdrop targets: MegaETH, Abstract, Unichain."
- "Secondary coverage: Base, Arbitrum, Scroll, Linea, zkSync. These may do secondary ecosystem airdrops or partner token events."
- "On MegaETH specifically — there's no DEX yet. So the system focuses on wrap/unwrap and contract deploys. Contract deploys are actually the highest-signal activity for a brand new chain, because almost nobody does them."

---

## SECTION 5 — SETTING UP CLAUDE CODE [18:00–22:00] (4 min)
**Format:** Screen share — terminal

### [FEEDBACK #1 — Platform-specific install instructions]

### What Lewis shows:

**Mac:**
- Open Terminal.app
- `node --version` — check if already on v20+
- If not: `brew install node` (or show downloading from nodejs.org)
- Install Claude Code: `npm install -g @anthropic-ai/claude-code`
- Run `claude` — show the first-run auth flow (browser opens, sign in to Anthropic)

**Windows WSL callout (on-screen text overlay):**
> "Windows users: open Ubuntu from Start Menu, then follow along from here. The commands are identical inside WSL."

**Linux VPS callout:**
> "On VPS: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`, then install Claude Code the same way."

### Key talking points:
- "Claude Code is Anthropic's AI terminal assistant. Think of it like a senior developer who lives in your terminal. In a few minutes we're going to paste a setup file into it and it'll install and configure this entire system automatically."
- "You need a free Anthropic account. The setup file runs in about 10–15 minutes. Free tier is plenty for this."
- "If you already have Claude Code working, you can skip ahead to the next section."

---

## SECTION 6 — THE ONE-SHOT SETUP (LEAD MAGNET DEMO) [22:00–36:00] (14 min)
**Format:** Screen share — real-time terminal walkthrough. This is the centrepiece of the video.

### What Lewis shows (step by step, in real time):

**Step 1: Download and open the setup file**
- "Go to the link in the description, enter your email, download the file. It's called SETUP-PROMPT.md."
- Open the file in any text editor to briefly show what it contains: "This is the entire setup as instructions for Claude Code."
- `cat ~/Downloads/SETUP-PROMPT.md | pbcopy` (Mac) — copies it to clipboard

**Step 2: Paste into Claude Code**
- `claude` in terminal → Claude Code opens
- Paste the file contents — Claude Code reads and begins
- "Watch it work."

**Step 3: Prerequisite checks**
- Claude Code checks `node --version` and `git --version`
- If anything is missing, it provides and runs the install commands automatically
- Lewis narrates: "It's verifying the environment. If Node wasn't at v20, it'd install it now."

**Step 4: Clone and install**
- Claude Code runs: `git clone https://github.com/LewisWJackson/airdrop-farmer.git jackson-airdrop-farm`
- `cd jackson-airdrop-farm && npm install`
- Show packages installing: "ethers, inquirer, chalk — all the dependencies."

**Step 5: Encryption key and .env**
- Claude Code generates a 32-byte hex encryption key
- Creates `.env` with `ENCRYPTION_KEY=...` and RPC placeholders
- "This key encrypts your private keys on disk. It stays in your .env file or Railway's environment variables — never in the code."

**Step 6: Telegram bot setup**
- Claude Code explains: open Telegram, search @BotFather, send `/newbot`, follow prompts, copy the token
- "Type a name — 'My Airdrop Farm' — and a username. BotFather gives you an API token. Paste it here."
- Then: search @userinfobot, send any message, it replies with your chat ID
- Claude Code saves both to `.env`

**Step 7: Generate wallets**
- `npx tsx src/index.ts` — the interactive menu appears
- Select option 1: Generate Wallet Fleet, count = 10
- 10 addresses appear on screen
- **Mnemonic phrase displayed in yellow** — Lewis pauses: "Stop. Write this down. These 12 words can recover every wallet and every airdrop token they ever earn. Do not screenshot it. Write it on paper, right now."

**Step 8: Fund W00**
- W00 address displayed prominently in a box
- [FEEDBACK #5] "Send ETH from any exchange. It does not matter which one."
- "Coinbase, Binance, Kraken, Caleb & Brown — go to Withdraw, paste this address, select the Ethereum Mainnet network, send 0.05 to 0.1 ETH."
- "That's it. If you've ever sent crypto before, this is the same thing. Network: Ethereum. Amount: 0.05–0.1 ETH."
- Claude Code polls for the balance to arrive — shows checking loop with spinner

**Step 9: Bridge and distribute**
- Claude Code runs: `npx tsx src/fund-all-chains.ts`
- "It's bridging from Ethereum mainnet to MegaETH, Abstract, and Unichain, then distributing across all 10 wallets."
- Show transactions appearing — "Each one of these is an on-chain transaction. Your first farming activity just started."

**Step 10: Railway or PM2?**
- Claude Code asks: "How would you like to run the farmer?"
  - Option A: Railway (cloud, always-on, free tier)
  - Option B: PM2 (local Mac/Linux)
- Lewis shows Railway path live: `railway login` → `railway init` → env vars set → `railway up`
- Briefly show PM2 alternative: `npm run start:pm2` → `pm2 list`

**Step 11: Success**
- Railway dashboard showing deployment
- "And there it is. Your farm is live. The first run kicks off at 8am UTC — or within the next few hours depending on when you did this."
- Wait for (or replay) the first Telegram notification arriving

### Key talking points throughout:
- "This used to take me 45 minutes to set up manually for each person. The setup file compresses that to 10–15 minutes."
- At mnemonic: "This is the only moment it shows you this phrase. Back it up now."
- At the ETH send step: [FEEDBACK #5] "Buy ETH anywhere, send it to this address. That's the whole instruction."
- During bridging: "The system is diversifying your funds across all three chains automatically. You don't need to touch any bridge website."

---

## SECTION 7 — DEPLOYMENT OPTIONS (DETAIL) [36:00–42:00] (6 min)
**Format:** Screen share — Railway dashboard, terminal, PM2 output

### [FEEDBACK #1 — Full platform coverage]

### Sub-section A: Railway — recommended for most people (2 min)
- Show Railway dashboard after `railway up` — deployment in progress
- "Railway is the simplest option if you want it running without your computer."
- Show `railway.json`: `"startCommand": "npx tsx src/run-railway.ts"` — this is the cloud entry point
- Environment variables tab: `ENCRYPTION_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- "Railway's free plan includes $5/month of compute credits. This farmer uses roughly $2–3/month. Fits comfortably."
- Show deployment logs: "It's running. Every 8 hours, it'll fire. You'll get a Telegram message each time."

### Sub-section B: PM2 on Mac (2 min)
- "If you'd rather run it locally: `npm run start:pm2` from inside the project folder."
- Show `pm2 list` output with the `jackson-airdrop-farm` process listed as `online`
- "Cron schedule: 8am, 2pm, 8pm UTC. PM2 fires it on that schedule automatically."
- `pm2 logs jackson-airdrop-farm --lines 50` — show live log output
- "For Mac: run `pm2 startup` and `pm2 save` once. The farmer will restart automatically if you reboot."
- "If you close your laptop for a week, the farmer pauses. That's fine for casual farming. For serious farming, use Railway."

### Sub-section C: Linux VPS (1 min)
- "Cheapest always-on option: a $4–6/month Hetzner or DigitalOcean VPS."
- "SSH in, install Node 20, clone the repo, `npm install`, copy your `.env`, `npm run start:pm2`. Identical to Mac."
- "The setup file handles this exactly the same way — just run it inside your VPS terminal via SSH."
- "This is how I'd run it if I wanted maximum uptime for minimum cost."

### Sub-section D: Windows WSL (1 min)
- "Inside WSL Ubuntu terminal, PM2 works identically to Linux."
- "Run `pm2 startup` inside WSL, follow the instructions it prints. The farmer will start with Windows."
- "Honestly: Railway is the easier choice on Windows. No WSL complexity at all."

---

## SECTION 8 — SECURITY BEST PRACTICES [42:00–47:00] (5 min)
**Format:** Talking head to camera, then screen share for the code walkthrough

### [FEEDBACK #4 — Dedicated security chapter]

### Key talking points:

**The mnemonic phrase:**
- "Your 12-word recovery phrase is the master key to all 10 wallets and every airdrop token they will ever earn. Never type it into a website. Never send it to anyone — including me. Store it offline: write it on paper, ideally in a fireproof location. Not in a screenshot. Not in your Notes app."

**The ENCRYPTION_KEY:**
- Show `data/wallets.enc.json` — scroll through it: "This is what your private keys look like at rest — encrypted with AES-256. Without the encryption key, this file is useless."
- "The encryption key lives in `.env` locally, or in Railway's environment variable settings. It never appears in the code or in git history."
- "The `.gitignore` file excludes `.env` by default. If you ever fork this repo, double-check that before pushing."

**Never put main holdings at risk:**
- "Farming amounts are tiny. Each task uses 0.0003 ETH. These wallets hold just enough to farm — nothing more."
- "Your main crypto should be in a separate hardware wallet. These 10 wallets are purpose-built for farming. Low value, high activity."

**The safety module — show on screen:**
- Open `src/safety/index.ts`
- Walk through the four layers:
  1. `validateTaskAddresses` — every destination address checked against a known-good registry before the transaction is built
  2. `preSimulate` — the transaction is dry-run on the RPC before it's signed. If it would fail or produce unexpected results, it's blocked
  3. `snapshotBalance` + `checkBalanceDrop` — after the transaction, balance is checked. If it dropped more than expected, a critical Telegram alert fires
  4. `revokeAllowance` — after every DEX swap, the token approval is revoked. No lingering approvals for anyone to exploit

**Approval revocation:**
- "After every swap, the system zeroes out the token approval it granted to the DEX. This is a step most people skip in manual farming. The system does it automatically."

**When airdrop tokens land:**
- "The tokens go into the farming wallets. Move them to your main wallet immediately. Don't leave significant value in farming wallets any longer than necessary."

**Open source:**
- "Every line of this code is public at github.com/LewisWJackson/airdrop-farmer. Read it. I encourage you to."

---

## SECTION 9 — MONITORING & ONGOING MAINTENANCE [47:00–51:00] (4 min)
**Format:** Screen share — Telegram, terminal, Railway logs

### What Lewis shows:
- Telegram notification: exact format — "Farming Run Complete — Tasks: 5/5 succeeded — Chains: megaeth, abstract, unichain"
- `pm2 logs jackson-airdrop-farm --lines 50` — live log stream
- Railway dashboard logs tab
- `npx tsx src/check-all-balances.ts` — balance table across all wallets and chains
- Activity log via interactive menu: `npx tsx src/index.ts` → option 5

### Key talking points:
- "Once it's running, day-to-day management is almost zero. Check your Telegram once a day."
- "After every farming run you'll get a summary: tasks attempted, tasks succeeded, chains farmed, total transactions logged."
- "Critical errors — like an unexpected balance drop or a blocked transaction — trigger an immediate high-priority Telegram alert. You'll know if something is wrong."
- **Weekly check-in routine (show as on-screen list):**
  1. Check Telegram — any failed runs?
  2. Run `check-all-balances.ts` — are farming wallets above 0.001 ETH each?
  3. If low: top up W00 and re-run the distribute script
  4. Check if any target chains have announced airdrop dates — if so, consider bumping activity
- "The activity log shows every transaction by wallet, by chain, with success/fail status and tx hash. Use it to confirm the system is generating real history."

---

## SECTION 10 — LEAD MAGNET CTA & CLOSE [51:00–55:00] (4 min)
**Format:** Talking head to camera

### [CTA at exactly the 45-minute mark — also hit it here at close]

### Lead magnet CTA (45-minute mark — cut back to camera mid-section 9):
- "Quick pause — if you want everything I just showed you without doing any of this manually, the setup file is in the description. It's free. Enter your email and I'll send the download link. It's called the Jackson Airdrop Farm One-Shot Setup. Paste it into Claude Code, follow the prompts, done in 10–15 minutes."

### Closing talking points:
- "The farming window on MegaETH and Abstract is open right now. These chains have serious VC backing, active ecosystems, and no token yet. That combination — verified funding, real users, no token — is exactly what the Arbitrum and zkSync early farmers saw before those drops."
- "You don't need to be a developer. The setup file handles everything. If you can paste text into a terminal, you can run this."
- Recap the math: "Worst case: no airdrops. You spent $50 in gas over six months. Best case: one Arbitrum-sized drop on Abstract gives you $20,000. That's the bet. I think it's a good one."
- "Subscribe. I'm adding Monad support to the farmer in the next few months and I'll cover it here first."
- "Comment below if you hit any issues in setup. I read every comment and I'll help."
- End card: subscribe, like, lead magnet link in description

---

## PRODUCTION NOTES

### B-roll needed:
- Telegram notification screen recordings (can be staged with real bot)
- Terminal farming activity at 4x speed
- ETH price chart (TradingView)
- Arbitrum/zkSync airdrop announcement screenshots — source from original Twitter/X posts
- Chain explorer pages showing transaction activity for a sample wallet
- Railway dashboard after deployment

### Thumbnail concept:
- Split screen: Lewis sleeping vs green terminal with farming activity scrolling
- Text overlay: "10 Wallets. 3 Chains. 0 Effort." or "I Farmed $20K In Airdrops While I Slept"
- Bright green terminal colour on dark background — high contrast

### Description (in order):
```
Lead magnet (free setup file): [Google Drive link]
GitHub: https://github.com/LewisWJackson/airdrop-farmer
Railway (cloud hosting): https://railway.app
Caleb & Brown (buy ETH): [referral link]

Timestamps:
0:00 - Hook
3:00 - What is an airdrop? (profit mechanics)
9:00 - Costs, prerequisites & platform guide (Mac/Windows/Linux)
14:00 - Architecture overview
18:00 - Setting up Claude Code
22:00 - One-shot setup demo
36:00 - Railway / PM2 / VPS deployment
42:00 - Security best practices
47:00 - Monitoring & maintenance
51:00 - Lead magnet + close
```

### Pinned comment (post immediately after publishing):
```
Lead magnet (free one-shot setup file): [Google Drive link]
Paste it into Claude Code (claude in your terminal) and follow the prompts.
Takes 10–15 minutes. Watch the security section (42:00) before funding wallets.
```
