# "I Built an Automated Airdrop Farmer With Claude Code (Full Setup Masterclass)"
## Complete Video Script — Jackson Airdrop Farm

**Total runtime target:** 50–55 minutes
**Format:** Masterclass / screen-recorded tutorial. Lewis talks to camera at open and close. All technical sections are screen-recorded with voiceover.
**Audience:** Crypto-curious, some technical. Has heard of airdrops, may not know how to set up anything more complex than a MetaMask wallet.

---

## SECTION 1 — HOOK [0:00–3:00]

*[Lewis to camera.]*

I built a bot that farms crypto airdrops automatically with Claude Code — at a scale no human could manage manually. Let me explain what that means because if you don't know what an airdrop is, this is actually really simple.

Imagine you signed up for a new app. Used it a few times over a few months. Then one day the company behind it sent you two thousand dollars worth of shares as a thank you for being an early user.

That's what crypto airdrops are. It's happened multiple times with real payouts in the thousands per person. The people who knew about it in advance and set up ten accounts instead of one walked away with twenty to forty thousand dollars. For just using an app.

Here's the thing. The people who are really good at this — the ones who live in crypto, who've spent years learning how airdrops work, who do this manually across multiple wallets — they still can't do what this system does. They can't manage ten wallets with consistent, randomised, human-looking activity across nine different platforms simultaneously. It's not possible to do manually. This system does it automatically, around the clock, without you touching anything.

This video hands that to someone who's never heard the word airdrop. For free. In about ten minutes.

I'm not here to make any money from you. I've got nothing to sell. I don't even want your email. I just want you to make a ton of money.

---

## SECTION 2 — WHAT IS AN AIRDROP? [3:00–9:00]

*[ON SCREEN: Simple diagram — draw or animate as Lewis explains: Wallet → Interacts with chain → Snapshot → Token distribution → Real money.]*

**SETUP:**

In this video — three things. First, you'll understand exactly how airdrops work and why the math on this is genuinely compelling. Second, you'll have ten accounts running automatically, farming the platforms most likely to pay out in 2026. And third, I'm going to give you a file that sets the whole thing up in about fifteen minutes.

I'm not here to make any money from you. I've got nothing to sell. I want to give this all to you for free. I don't even want your email. I just want you to make a ton of money.

Now let me explain how this actually works from the ground up — because the mental model most people have about airdrops is subtly wrong, and that wrong model is exactly why most people either don't farm at all, or farm in a way that gets their wallets excluded. And you don't find out you were excluded until airdrop day, when the announcement drops and you check your wallet and see nothing.

**TENSION:**

The common assumption is that airdrops are goodwill gestures. Chains throwing tokens at early users as a thank you. That framing makes it sound random — like winning a raffle. Which leads people to think "I'll just use the chain a bit and see what happens." That approach gets you either nothing or the bare minimum.

What's actually happening is a selection process. New chains need to prove to investors and ecosystem partners that real humans are using their network before the token launches. On airdrop day they don't just give tokens to everyone who interacted. They score every wallet.

*[ON SCREEN: Show the three metrics appearing one by one as a list.]*

Every major airdrop has weighted wallets on three criteria.

**Transaction count.** Not a burst of fifty transactions in one afternoon — chains specifically penalise that pattern. Genuine, sustained interactions over time.

**Contract diversity.** Did this wallet use multiple protocols? A single DEX swap looks like one thing. A DEX swap, a lending deposit, a bridge, and a contract deploy looks like a real person exploring an ecosystem. Chains want the second type.

**Time span.** Was this wallet active across months? Activity compressed into one week signals someone who found out about the snapshot and rushed. Activity spread across six months looks like a genuine early adopter. Most chains weight this heavily.

**PAYOFF:**

So the game isn't "interact with the chain." The game is "look like a real, curious user who has been genuinely exploring this chain for months."

Here's where it gets interesting. Managing ten wallets manually — different timings, different amounts, different transaction types across multiple chains — is not something a human can realistically do. This system does it automatically. And if you wanted to scale to a hundred wallets, you just fund more wallets. The system handles the rest. You can operate at a scale that is genuinely supernatural. No human could do this manually. That's the point.

---

*[ON SCREEN: Three chain cards appearing — MegaETH, Abstract, Unichain. Build them one at a time.]*

**SETUP:**

Now — which platforms are we farming and why these three specifically.

**TENSION:**

Most people who look into this just pick whatever chain is trending. The problem is the chains that are trending have usually already done their airdrop. You want to be on chains before the token launches — not after. The criteria is simple: serious backing, a track record of rewarding early users, and no token yet.

**PAYOFF:**

All three of these chains have none of their tokens launched yet. All three are backed by people who have previously delivered large airdrops. That's the criteria. That's why these three.

**MegaETH** is backed by Vitalik Buterin — the founder of Ethereum. No token yet. Live mainnet.

**Abstract** is backed by a team with a strong track record of community rewards. No token yet. Active ecosystem.

**Unichain** is the official L2 from Uniswap — one of the biggest platforms in crypto. They have never done a dedicated L2 airdrop. If they do one here, it could be the largest we've seen.

None of these have tokens. All of them have serious backing. All of them have history of rewarding early users through their previous projects. That's the window.

*[ON SCREEN: Math breakdown as a clean card. Build each line.]*

Let me put the numbers on screen.

One chain. Conservative zkSync-level payout — five hundred dollars per wallet, ten wallets. That's five thousand dollars. Arbitrum-level payout, two thousand per wallet across ten wallets — twenty thousand dollars.

Your cost to generate six months of activity across all three chains: roughly five to eight dollars a month in gas. Six months — call it fifty dollars total.

Worst case: no airdrop happens. You spent fifty dollars.
Best case: one mid-tier event on any of these three chains — five to twenty thousand dollars.

That's the asymmetric bet. That's why you target three chains simultaneously. You only need one of them to pay off.

This is not guaranteed. Airdrops can exclude wallets, underperform expectations, or not happen at all. I want to be clear about that. But the expected value on three pre-token chains with this backing profile is the best asymmetric bet I know of in crypto right now.

---

## SECTION 3 — COSTS, PREREQUISITES & PLATFORMS [9:00–14:00]

**SETUP:**

Before we get into the build there are timestamps in the description if you want to skip ahead — but I'd ask you to watch this section first. You need to know what this is going to cost you and what you need to have ready before you start. Skip this and you'll hit a wall mid-setup. It's five minutes. It's worth it.

**TENSION:**

The mistake most people make is jumping straight to the setup and figuring out the costs as they go. It sounds fine until you get to the step where you need ETH in an exchange account ready to send — and you don't have it. Setup stalls. Most people don't come back.

**PAYOFF — Costs:**

*[ON SCREEN: Screenshot of costs table from GitHub — screen share.]*

I'll pull up the costs breakdown from the GitHub page. The short version: you need between roughly a hundred and thirty and two hundred and sixty dollars of ETH as your farming capital — that's not spent, it sits in your wallets doing the farming. Gas costs across all ten wallets are about five to eight dollars a month. Hosting is free. That's it.

*[ON SCREEN: Screenshot of prerequisites from GitHub — screen share.]*

Prerequisites are also on the GitHub page. The main one to sort before you start is a crypto exchange account — Coinbase, Binance, Kraken, Caleb and Brown, anything that lets you buy ETH and send it to an external address. Everything else — Node, Git, Railway CLI — the setup handles automatically if it's missing.

**PAYOFF — Platforms:**

This works on Mac, Windows, and Linux. If there are any differences for your platform, they're covered on the GitHub page with a separate setup file for each. The short version: whatever computer you're on, follow the instructions for your platform in the GitHub and it will work.

---

*[RE-HOOK — ~14 min. Lewis back to camera.]*

You know the opportunity, you know what it costs, you know your machine will run it. Before we build it — let me show you how it actually works, because there's one thing most farming setups get completely wrong that gets wallets excluded. Understanding it takes a few minutes and makes everything that follows make sense.

---

## SECTION 4 — HOW THE SYSTEM WORKS [14:00–18:00]

**SETUP:**

Most tutorials drop you straight into setup commands without explaining what you're actually building. I think that's backwards. So let me show you how this system works from start to finish — because once you understand it, you'll understand why every design decision in it is the way it is.

**TENSION:**

The naive approach to airdrop farming is one wallet, doing the same transaction on a schedule. Same amount every time. Same action. Same timing. That looks exactly like what it is — a bot. Chains have what's called Sybil resistance — an anti-bot detection layer that looks for wallets behaving identically. Ten wallets funded from the same source, created at the same time, doing the same transactions at the same intervals — that pattern gets flagged and excluded. It has happened with real airdrops. Wallets excluded after the snapshot. Nothing to show for months of activity.

**PAYOFF:**

This system is built around avoiding that at every level.

Ten wallets. Each one has what I'd call a personality — different active hours, different transaction amounts, different delays between actions. The goal is for each wallet to look like a different human with different habits. They're not doing the same thing at the same time. They're doing different things at different times in different amounts.

*[ON SCREEN: Show Telegram notification format.]*

Three times a day — morning, afternoon, evening — the scheduler fires. It picks wallet and chain combinations at random, runs a sequence of transactions, and sends a Telegram message to my phone confirming what happened. "Farming Run Complete — Tasks: five of five succeeded." That's my daily confirmation the system is running.

Nine chains covered. Primary targets — MegaETH, Abstract, Unichain. Secondary coverage on several others for any additional ecosystem events.

Every transaction is validated by a security module before it goes on-chain. I'll cover what that actually means in the security section.

---

*[RE-HOOK — ~18 min. Lewis back to camera.]*

Ten wallets with individual personalities. Nine chains. Three times a day. Randomised activity designed to look human at a scale no human could actually manage manually. That's the system.

Now let's build it. And I'm going to show you a way to get all of this set up and running in about five minutes.

---

## SECTION 5 — SETTING UP CLAUDE CODE [18:00–22:00]

*[ON SCREEN: Mac Terminal open.]*

**SETUP:**

Before the one-shot setup can run, you need Claude Code installed and authenticated in your terminal. If you already have it working, skip ahead to the next section. If not, this takes about three minutes.

*[ON SCREEN: On-screen overlay: "Windows users: open Ubuntu from Start Menu first."]*

**TENSION:**

The thing that catches people out here isn't the installation — it's the Node version. Claude Code requires Node 18 or higher. The setup file requires Node 20. I've seen people get halfway through setup and hit an error that looks completely unrelated until you realise their Node is version 16 from two years ago. Let's check yours before anything else.

**PAYOFF:**

*[ON SCREEN: Type `node --version`.]*

If that returns v20 or higher, you're good — skip the next step.

If it returns anything lower, or Node isn't installed: on Mac, run `brew install node`. No Homebrew? The install command is one line — I'll put it in the description. On Linux or WSL: run the NodeSource setup script first, then `sudo apt-get install -y nodejs`. I'll link that too.

*[ON SCREEN: `npm install -g @anthropic-ai/claude-code` running.]*

Install Claude Code with that command. When it's done, type `claude` and hit enter. A browser window opens — sign in to your Anthropic account or create one. Free tier is fine for this. Once you're authenticated, you'll see the Claude Code prompt in your terminal.

*[ON SCREEN: Claude Code prompt visible.]*

Quick note about what Claude Code actually is, because it matters for how you use the setup file. It's not just an AI chat window in your terminal — it can run commands, read files, handle errors, and adapt when things go wrong. When you paste the setup file into it in the next section, if your Node version is wrong or a dependency fails to install, it doesn't stop and ask you what to do. It diagnoses the issue and fixes it before continuing. You end up with a working setup or a clear explanation of what's blocking it — not a half-configured system and an error you have to Google.

---

## SECTION 6 — THE ONE-SHOT SETUP [22:00–36:00]

*[ON SCREEN: Browser — description link, then download page.]*

**SETUP:**

This is the centrepiece of the video. The file in the description is called SETUP.md. It's a set of instructions written specifically for Claude Code — ten steps that take you from nothing to a running farm. Most setup guides give you commands to run one at a time, and when something fails you're on your own figuring out which of the twenty steps caused it. This file is different. It checks before it acts. When something fails, it diagnoses and fixes it before moving on. And it has three hard stops built in where it will not continue until you confirm you've done something. I'll flag every one.

Download the file and open it in any text editor — you'll see the full set of instructions. Everything it does is readable before you run it. Nothing happens on your machine without you being able to see exactly what's coming.

---

### STEP 1: Copy the setup file

*[ON SCREEN: Mac: `cat ~/Downloads/SETUP.md | pbcopy`. On-screen overlay: "Windows/Linux: open file, select all, copy."]*

On Mac, that command copies the entire file to your clipboard. On Windows or Linux, open it in any text editor, select all, copy.

---

### STEP 2: Paste into Claude Code

*[ON SCREEN: `claude` in terminal. Paste. Claude Code begins reading.]*

Watch what happens here. It reads the entire set of instructions first, then starts working through them in order.

---

### STEP 3: Prerequisite checks

*[ON SCREEN: Claude Code runs `node --version`, `git --version`, `railway --version`. Results appearing.]*

**SETUP:**

It's verifying your environment before touching anything. This matters more than it sounds.

**TENSION:**

If you skipped Section 3 and your Node is below version 20, this is where it catches you — not five steps later when the error is confusing. Claude Code checks all three prerequisites and installs anything missing before moving on.

**PAYOFF:**

*[ON SCREEN: Claude Code prints the prerequisites confirmed message — Node, Git, Railway versions listed.]*

When you see that confirmation printed, your environment is verified. Everything from here runs cleanly.

---

### STEP 4: Clone and install

*[ON SCREEN: `git clone` running → `npm install` running, packages listed.]*

It's cloning the repository from GitHub — the public code you can read at the link in the description. Then installing dependencies: ethers for Ethereum interactions, chalk for terminal formatting, inquirer for the interactive menus.

When `npm install` completes, the project structure is in place. The next step is where the security configuration starts.

---

### STEP 5: Encryption key and environment setup

*[ON SCREEN: Claude Code generates a 64-character hex key and creates `.env`.]*

**SETUP:**

This step creates the master key that protects your private keys at rest. It's worth understanding exactly what's happening here, because this is one of the moments the setup file handles differently from most farming guides.

**TENSION:**

The pattern I see most in farming setups is private keys stored in plain text. A text file called `wallets.json` with your keys sitting in it unprotected. That means anyone with access to your filesystem — malware, a misconfigured cloud deployment, someone who has your machine briefly — can read your keys directly. The historical record on how people lose crypto is full of exactly this scenario. It's not usually a sophisticated hack. It's usually this.

**PAYOFF:**

What Claude Code is generating now is a 32-byte cryptographically random key — 64 hex characters. Your wallet private keys will be encrypted with this key using AES-256-GCM before they're written to disk. The result is that `wallets.enc.json` file I showed you in the architecture section — a file that is computationally useless without the key that's about to go into your `.env`.

Keep this key in your `.env` locally, or in Railway's environment variables for cloud deployment. Never put it in the code. Never commit it to git. The `.gitignore` already excludes `.env` — we'll verify that in the security section.

---

### STEP 6: Telegram setup

*[ON SCREEN: Claude Code prints the Telegram setup instructions. Lewis follows along in Telegram on phone.]*

**SETUP:**

You need two values from Telegram: a bot token and your chat ID. This takes about two minutes and it's the step that gives you live notifications after every farming run.

**TENSION:**

The temptation here is to skip Telegram and just check the logs manually later. Most people say they'll come back to it. They don't — and then when the farm encounters an issue at 3am, they don't find out until they open their laptop three days later and notice the wallets haven't been active. The Telegram setup is two minutes. Do it now.

**PAYOFF:**

Open Telegram. Search for @BotFather — the official verified account with a blue checkmark. Send it: `/newbot`. It asks for a name — call it whatever you like, I used "My Airdrop Farm." Then a username ending in "bot." BotFather replies with your API token — a string of numbers, a colon, then letters. Copy the whole thing.

*[ON SCREEN: Paste token into Claude Code.]*

Paste it here.

Now search @userinfobot in Telegram, send it any message, and it replies with your user ID — just numbers. Copy that.

*[ON SCREEN: Claude Code saves both to `.env`, runs the test message command.]*

Claude Code saves both to your `.env` and sends a test message to confirm the connection. When you see that message arrive on your phone, Telegram is live.

---

### STEP 7: Generate wallets

*[ON SCREEN: Interactive menu appears — Claude Code runs `npx tsx src/index.ts`.]*

Option 1: Generate Wallet Fleet. When it asks for wallet count, enter 10.

*[ON SCREEN: Ten wallet addresses appear — W00 through W09. Mnemonic phrase displays below them in yellow.]*

*[Lewis pauses. Looks directly into camera. Slows down.]*

Stop. Before you do anything else — look at the yellow text at the bottom of your terminal.

That is your mnemonic phrase. Twelve words. This phrase is the master key to all ten wallets. Every airdrop token these wallets will ever earn — weeks, months, possibly years from now — is recoverable with those twelve words. And it is shown to you exactly once.

Do not screenshot it. Screenshots sync to iCloud, Google Photos, and every cloud photo service by default. Do not copy it into your Notes app or a text file on this machine. Write it on paper. Right now. Before you proceed.

And notice what's happened in your terminal. Claude Code has stopped and is asking you to confirm you've written the phrase down and stored it safely. It won't continue until you type YES and hit enter.

*[ON SCREEN: Claude Code message visible — asking for YES confirmation.]*

That's not me telling you this is important. That's the setup file itself enforcing the stop. It literally will not proceed without your confirmation.

Take the time. Write the words down. Put the paper somewhere safe.

*[3–4 second pause.]*

Done? Type YES and continue.

---

### STEP 8: Fund W00

*[ON SCREEN: Claude Code displays W00 address prominently in a framed box.]*

**SETUP:**

One wallet — W00, your first wallet — is your funding hub. Everything flows from here. The system handles all the distribution automatically.

**TENSION:**

The moment that makes people nervous here is sending real ETH to an address they've never seen before. Which is understandable — if you get the address wrong or send it on the wrong network, that ETH is gone. So let me show you exactly what to check before you hit send.

**PAYOFF:**

Two things to verify. First: the network. Go to Withdraw on your exchange. Select ETH. The network field must say Ethereum Mainnet — not Arbitrum, not Base, not any L2. Ethereum Mainnet. L2 deposits go to a different address format and won't register here.

Second: the address. Copy the W00 address from your terminal. Paste it. Verify the first four characters and last four characters match what's on screen.

Amount: nought-point-nought-five to nought-point-one ETH. Send.

*[ON SCREEN: Claude Code shows balance polling — spinner running, checking on interval.]*

Claude Code is now polling for that ETH to arrive. Ethereum transactions typically confirm in one to five minutes. When the balance registers in W00, it moves automatically to the next step. You don't have to do anything — just watch.

*[ON SCREEN: Balance detected — proceeds to bridge step.]*

---

### STEP 9: Bridge and distribute

*[ON SCREEN: Claude Code runs `npx tsx src/fund-all-chains.ts`. Transactions appearing line by line.]*

**SETUP:**

This is the moment your farming history actually starts. Watch what's happening on screen.

**TENSION:**

Setting up ten wallets on three chains manually means logging into each bridge website, connecting MetaMask, approving each transaction individually, waiting for confirmations, doing this for every chain and every wallet. I've done this. It takes the better part of an hour per setup — and it's easy to get a wallet or chain wrong in the middle of it.

**PAYOFF:**

Claude Code is doing all of it right now. Bridging ETH from Ethereum mainnet to MegaETH, Abstract, and Unichain. Then distributing across all ten wallets. Each line appearing is a real on-chain transaction.

*[Narrate as transactions appear — don't rush it. Let the terminal breathe.]*

The amounts are sized specifically for six months of farming activity with gas costs accounted for. When the distribution completes, Claude Code runs a balance check across every wallet and every chain — showing you the funded state before moving to deployment.

---

### STEP 10: Deploy

*[ON SCREEN: Claude Code asks: Railway or PM2?]*

**SETUP:**

Last decision — where does the farmer run? This determines your uptime over the next six months.

**TENSION:**

The people who set this up and then find it has stopped running a week later almost always made the same choice: they ran it on PM2 locally, closed their laptop, and the farmer paused. That's expected behaviour for a local process manager. But it means missed farming windows — and farming windows compound. A wallet that was inactive for two weeks of a six-month window has a visibly thinner history on airdrop day.

**PAYOFF:**

I'm going to show you Railway — the cloud option — live now. I'll cover PM2 and VPS in detail in the next section.

*[ON SCREEN: `railway login` → browser authentication. `railway init` — project name: `jackson-airdrop-farm`.]*

`railway login` opens a browser. Log in and come back.

`railway init` links this directory to Railway.

*[ON SCREEN: Setting environment variables in Railway.]*

Now the environment variables. Your encryption key, Telegram bot token, and Telegram chat ID — the same values from your `.env`. One additional step here: the encrypted wallet file needs to travel to Railway. The setup file handles this by base64-encoding `wallets.enc.json` and storing it as an environment variable. So your wallets never touch Railway's filesystem as a file — they're encoded and stored alongside your other secrets. To decode them, you'd need both the WALLET_DATA variable and the encryption key. Two separate secrets, neither of which appears in your code.

*[ON SCREEN: `railway up -d` deploying. Railway dashboard — deployment live, green status.]*

`railway up`. When that turns green, your farm is running in the cloud.

*[ON SCREEN: Telegram notification arriving — "Farming Run Complete."]*

There it is. First Telegram notification from your live farm.

Your farm is running.

---

*[RE-HOOK — ~36 min. Lewis back to camera.]*

The system is live. Ten wallets, three chains, three times a day. If you stopped watching right now, that would work.

But right now, sitting on each of those wallets, there's an open token approval from the DEX swap that just ran. That approval doesn't expire. It stays open indefinitely — and it's an attack vector that has been used to drain farming wallets before. The security section closes it, and it takes five minutes to understand. Before you add serious money to these wallets, watch it.

---

## CTA — [~36 min — after re-hook, before Section 7]

*[Lewis to camera.]*

Quick pause — before the security section. If you want the setup file without doing any of this manually, it's in the description. Free. Enter your email and I'll send it. Paste it into Claude Code, follow the prompts, done in fifteen minutes. The security section applies whether you used the file or followed along manually — watch it either way.

---

## SECTION 7 — DEPLOYMENT OPTIONS IN DETAIL [36:00–42:00]

*[ON SCREEN: Split — Railway dashboard left, terminal right.]*

**SETUP:**

You've seen Railway at a high level. Let me cover all three deployment options properly so you can make the right choice for your situation and know how to manage it going forward.

---

**Railway — recommended for most people**

*[ON SCREEN: Railway dashboard — deployment logs tab.]*

**TENSION:**

The failure mode I see most with local setups is people who ran PM2 in good faith, went away for a week, and came back to a farm that had been paused the entire time. Not a bug — expected behaviour. But that's potentially a week of farming history missing across all three chains.

**PAYOFF:**

Railway runs your farm in the cloud. Your laptop can be off, closed, in another country. The cron schedule runs at 8am, 2pm, 8pm UTC regardless. Your deployment logs are in the Railway dashboard — every farming run recorded. Free tier covers this easily.

The one thing to know: if you need to update the farm code, `railway up` from the project directory redeploys in about ninety seconds.

---

**PM2 on Mac or Linux**

*[ON SCREEN: `npm run start:pm2` → `pm2 list` output.]*

**SETUP:**

If you're comfortable running the farm locally and you know your machine will generally be on — PM2 is completely adequate.

**PAYOFF:**

`npm run start:pm2` starts the process. `pm2 list` shows it online. The cron schedule is built into the ecosystem config — 8am, 2pm, 8pm UTC.

Two commands to make it survive reboots: `pm2 startup` — run it, copy and run the command it prints. Then `pm2 save`. After that, if your machine restarts, the farmer restarts with it.

`pm2 logs jackson-airdrop-farm --lines 50` is your live log view.

---

**Linux VPS — best for serious six-month farming**

*[ON SCREEN: Terminal — SSH session.]*

**SETUP:**

If you want maximum uptime for minimum cost and don't want to think about it again for six months — this is the setup.

**PAYOFF:**

Four to six dollars a month on Hetzner or DigitalOcean gets you a machine that never sleeps. SSH in, install Node 20, clone the repo, `npm install`, copy your `.env`, `npm run start:pm2`. Identical commands to Mac. The setup file runs identically inside a VPS terminal — just SSH in first.

---

**Windows WSL**

**PAYOFF:**

Inside WSL, PM2 works identically to Linux. Run `pm2 startup` inside the WSL terminal and follow what it prints.

Honestly: Railway is the simpler choice on Windows. No WSL complexity, no startup configuration. Deploy once and you're done.

---

## SECTION 8 — SECURITY [42:00–47:00]

*[Lewis to camera.]*

**SETUP:**

The security section. I want to cover this properly because it's the part that determines whether farming goes well or badly. None of this is complicated — but it's the stuff most tutorials skip, and it's specifically the stuff that causes people to lose their wallets.

**TENSION:**

The way most people lose crypto in farming setups isn't hacks in the technical sense. It's human error with key management. Mnemonic phrases typed into websites. Private key files committed to public repositories. ENV files pushed to GitHub. Screenshots synced to cloud services. These aren't exotic attack vectors. They're things that happen when people move quickly through a setup without understanding what each file contains.

Let me make sure you understand exactly what you're protecting and how.

---

**PAYOFF — Mnemonic phrase:**

Your twelve-word recovery phrase is the master key to all ten wallets and every token they will ever earn. Never type it into any website — including wallet websites. Never send it to anyone. Offline storage only: written on paper, ideally somewhere fireproof. If you lose it and something happens to your machine, those wallets and everything in them is unrecoverable.

---

**PAYOFF — Encryption key:**

*[ON SCREEN: Scroll through `data/wallets.enc.json` — show encrypted content.]*

This is what your private keys look like on disk. AES-256 encrypted. Without the key in your `.env`, this file is computationally useless. Your encryption key lives in `.env` locally or in Railway's environment variable settings. It never appears in the code.

*[ON SCREEN: Show `.gitignore` — `.env` entry.]*

`.env` is excluded from git by default. If you ever fork this repo or push it anywhere, verify that line is in your gitignore before you push.

---

**PAYOFF — Keep wallets lean:**

Each farming transaction uses about nought-point-nought-three ETH. Your wallets should hold farming amounts — not your crypto holdings. Main funds belong in a separate hardware wallet. These ten wallets are purpose-built farming machines. Low value, high activity.

When airdrop tokens land: move them to your main wallet immediately. Don't leave significant value sitting in farming wallets any longer than necessary.

---

**SETUP — Safety module:**

*[Lewis to camera → cut to screen share: `src/safety/index.ts`.]*

Now the safety module — the four layers of transaction validation that run under every single farming transaction. This is what separates this system from a script that just fires transactions and hopes for the best.

**TENSION:**

Most automated farming setups have no transaction validation. A transaction gets built, it gets signed, it goes on-chain. If a contract has been exploited, if an RPC is returning bad data, if an address has been tampered with — the transaction executes anyway. There's no layer catching it.

**PAYOFF:**

*[ON SCREEN: Walk through each function highlighted in the code.]*

**Layer one: Address validation.** Before any transaction is even built, every destination address is checked against a known-good registry. If the system tries to send funds anywhere outside that registry, it blocks the transaction and sends a Telegram alert.

**Layer two: Pre-simulation.** Before the transaction is signed, it's dry-run against the RPC. If it would fail, revert, or cost significantly more gas than expected, it's blocked. Nothing gets signed without this check passing.

**Layer three: Balance monitoring.** After every transaction, the wallet balance is checked. If it dropped more than the expected gas amount — if something went wrong the pre-simulation didn't catch — a critical alert fires immediately on Telegram.

**Layer four: Approval revocation.**

*[ON SCREEN: Highlight `revokeAllowance` function.]*

This is the one I want you to understand clearly. When you approve a DEX to spend your tokens for a swap, that approval stays open after the swap completes. It doesn't expire. It's a standing permission for that DEX contract to move your tokens. If the DEX contract is ever exploited — which has happened multiple times across major DEXes — every wallet with an open approval can be drained.

Most people farming manually leave these approvals open because they forget, or because revoking takes an extra transaction. This system revokes every approval automatically after every swap. Every farming run closes its own door behind it. You never have a lingering approval on any wallet, on any chain.

---

## SECTION 9 — MONITORING & MAINTENANCE [47:00–51:00]

*[ON SCREEN: Telegram notification format.]*

**SETUP:**

Once the farm is running, ongoing management is genuinely minimal. Here's what the actual routine looks like so you know what to expect.

**TENSION:**

The failure mode I see with automated systems isn't the technology — it's people who set them up and then assume they're running perfectly forever without checking. Usually they are. But occasionally a chain has an RPC issue, a wallet runs low on gas, or a transaction type starts reverting because a contract was upgraded. The way you catch these things early is a thirty-second daily check and a five-minute weekly check-in. If you skip both, small issues become missed farming windows.

**PAYOFF — Daily:**

Glance at your Telegram. After every run you'll see either "Farming Run Complete — Tasks: 5 of 5 succeeded" or a flag if something failed. Thirty seconds. That's your daily confirmation.

If you see a critical alert — unexpected balance drop or a blocked transaction — that warrants a look. Check the logs, check the specific wallet's balance on the chain explorer, post in the comments if you're not sure what you're seeing.

---

**PAYOFF — Weekly:**

*[ON SCREEN: Build the list on screen as Lewis speaks.]*

Four steps. Five minutes.

One: Check Telegram for the week. Any failed runs? How's the task success rate?

Two: Run `npx tsx src/check-all-balances.ts`. This prints every wallet, every chain, current balance.

*[ON SCREEN: Balance table — 10 wallets × 3 chains.]*

Three: If any wallet is below nought-point-nought-zero-one ETH on a chain, top up W00 and re-run the distribute script. The system handles the shortfall automatically.

Four: Check the news on your target chains. If MegaETH, Abstract, or Unichain announces an airdrop date or snapshot window, consider temporarily increasing farming frequency. You can adjust the cron schedule in `ecosystem.config.cjs` — I'll show the format in the comments.

---

**PAYOFF — Activity logs:**

*[ON SCREEN: `npx tsx src/index.ts` → option 5 — activity log.]*

The activity log shows every transaction by wallet, by chain, with success and fail status and transaction hash. Use this to verify the system is generating real on-chain history — and to check specific transactions on the chain explorer any time you want to.

---

*[RE-HOOK — ~51 min. Lewis back to camera.]*

The farm is running, the security layer is clear, the maintenance routine takes five minutes a week. Let me close with the honest picture of what the next six months actually looks like — and why the window matters right now.

---

## SECTION 10 — CLOSE [51:00–55:00]

*[Lewis to camera.]*

Let me put this in context one more time.

MegaETH and Abstract have serious VC backing, active ecosystems building on top of them, and no token yet. Unichain is live and Uniswap has historically rewarded early ecosystem participants generously. That combination — verified funding, real mainnet activity, no token — is exactly what the early Arbitrum and zkSync farmers were looking at before those drops happened.

You don't need to be a developer to run this. The setup file handles everything. If you can paste text into a terminal, you can run this system.

*[ON SCREEN: Math recap as a clean card.]*

One more time on the math, because it's the thing I want you to leave with. Worst case: no airdrop happens on any of the three chains. You spent fifty dollars in gas across six months. Best case: one Arbitrum-level event on any one of them — twenty thousand dollars across ten wallets. And you're running all three simultaneously.

That's the bet. I think it's a good one. It's also a bet that costs almost nothing to make.

*[Lewis — direct to camera.]*

A few things coming up on this channel. I'm adding Monad to the farmer — Monad is an EVM-compatible chain that recently launched with significant VC backing and no token. I'll cover the update here when it's ready.

I'm also doing a deeper dive on MegaETH specifically — the contract deploy scoring mechanic on a new chain with no DEX is worth its own video.

If this was useful, the like button is right there — it genuinely helps this reach people who should be seeing it. Subscribe if you want to catch the Monad update and the MegaETH deep dive.

The setup file is free in the description. If you hit anything during setup that wasn't covered here, comment below. I read every one.

And if the setup file saved you time — there's a star button on the GitHub repo. Takes five seconds and helps other people find it.

Go set it up. The window is open right now.

---

## END SCREEN CTA

*[Lewis — final 20 seconds before end card.]*

We just walked through every piece of this system manually so you understand what each part does. But there's one configuration decision in the setup file that most people make wrong — and it determines whether your farm runs uninterrupted for six months or pauses every time you close your laptop. Watch this next — I'll show you the exact setting, why it matters, and how to check yours is correct.

---

## PRODUCTION NOTES

### B-roll needed:
- Telegram notification screen recordings (can be staged with real bot)
- Terminal farming activity at 4x speed
- ETH price chart (TradingView)
- Arbitrum/zkSync airdrop announcement screenshots — source from original Twitter/X posts
- Chain explorer pages showing transaction activity for a sample wallet
- Railway dashboard after deployment

### Key filming notes:
- **The mnemonic hard stop (Step 7 in Section 6):** Full pause. Look directly into lens. Slow down. The 3–4 second actual wait is real — give viewers time to physically get a pen. Don't rush out of it.
- **The bridge/distribute sequence (Step 9 in Section 6):** Don't narrate over every line — let the terminal breathe. The contrast with the manual 45-minute approach should be said once, then let the activity on screen speak.
- **Re-hooks:** All four cut back to Lewis on camera. Each should feel like a natural breath — acknowledge what's been built, name the problem that still exists. Under 30 seconds each.
- **The approval revocation beat (Section 8):** Don't rush this. It's the most underserved technical payoff in the video. The "open door" framing is the right one — use it.
- **Closing math (Section 10):** Put it on screen, read it out, pause briefly after "that's the bet." The viewer is making a decision. Give them the moment.

### Thumbnail concept:
- Split screen: Lewis sleeping vs green terminal with farming activity scrolling
- Text overlay: "10 Wallets. 3 Chains. 0 Effort." or "I Farmed $20K In Airdrops While I Slept"
- Bright green terminal colour on dark background — high contrast

### Description (in order):
```
Lead magnet (free setup file): [Google Drive link]
GitHub: https://github.com/jackson-video-resources/Jackson-airdrop-farmer
Railway (cloud hosting): https://railway.com?referralCode=BLrK89
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
51:00 - Close
```

### Pinned comment (post immediately after publishing):
```
Lead magnet (free one-shot setup file): [Google Drive link]
Paste it into Claude Code (claude in your terminal) and follow the prompts.
Takes 10–15 minutes. Watch the security section (42:00) before funding wallets.
```
