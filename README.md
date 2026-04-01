# 🌾 Jackson Airdrop Farm

**Automated on-chain activity farming across MegaETH, Abstract, and Unichain — the 3 chains most likely to airdrop in 2025/26.**

Built by [Lewis Jackson](https://youtube.com/@LewisJackson) | [Full Tutorial Video →]([https://youtube.com/@LewisJackson](https://youtu.be/DtMxScA2gzk))

---

## What It Does

10 wallets perform realistic on-chain activity every 8 hours:
- Wrap/unwrap ETH
- Swap ETH ↔ USDC (Uniswap v3)
- Deploy smart contracts
- Cross-chain bridging (via Relay)

Airdrops reward wallets with genuine transaction history. This farm builds that history automatically while you sleep.

## Expected Setup Cost

| Item | Cost |
|------|------|
| ETH to fund wallets | ~0.05–0.1 ETH (~$150–$300) |
| Railway hosting (optional) | ~$5/month |
| Claude Code subscription | $20/month (or API credits) |
| Gas fees per day | ~$1–3 |

**Airdrop upside:** Historic airdrops have ranged from $50–$10,000+ per wallet. With 10 wallets across 3 chains = 30 positions.

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Claude Code** — `npm install -g @anthropic-ai/claude-code`
- **Railway CLI** (for cloud deployment) — [railway.app/install](https://railway.app/install)
- **Git**
- **0.05–0.1 ETH** on Ethereum mainnet (to fund the farm)
- **Telegram account** (for notifications)

### Windows Users
Install [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install) first, then follow Mac/Linux instructions inside WSL.

### VPS Users
Any Ubuntu 22.04+ VPS works. DigitalOcean $6/month droplet is sufficient.

---

## Quick Setup (One-Shot via Claude Code)

1. Open **[SETUP.md](SETUP.md)** on GitHub
2. Click the **copy button** (top-right corner of the code block)
3. Open your terminal and run: `claude`
4. Paste and press Enter

Claude Code handles the rest — prerequisites, wallets, funding, deployment. ~10–20 minutes.

---

## Manual Setup

```bash
# 1. Clone
git clone https://github.com/jackson-video-resources/Jackson-airdrop-farmer.git jackson-airdrop-farm
cd jackson-airdrop-farm

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env with your values (see Configuration section)

# 4. Generate wallets
npx tsx src/index.ts

# 5. Fund W00 (the main wallet) with 0.05–0.1 ETH
# Address is shown after step 4

# 6. Bridge & distribute to all chains
npx tsx src/bridge-abstract-now.ts
npx tsx src/fund-unichain.ts

# 7. Start farming
npm run start:pm2    # Local (Mac/Linux)
# OR
railway up           # Cloud (Railway)
```

---

## Configuration

Copy `.env.example` to `.env` and fill in:

```env
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_char_hex_key

# From @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# From @userinfobot on Telegram  
TELEGRAM_CHAT_ID=your_chat_id
```

---

## How to Buy ETH

You don't need a specific exchange. Any of these work:
- **Coinbase** — easiest for beginners
- **Binance**
- **Caleb & Brown** (what Lewis uses — no KYC for small amounts)
- Any exchange that lets you withdraw ETH to an external wallet

Buy ETH → withdraw to the W00 address shown during setup.

---

## Railway Cloud Deployment

Running on Railway means the farm runs 24/7 even when your computer is off.

```bash
# Login
railway login

# Create project
railway init

# Set environment variables
railway variables set ENCRYPTION_KEY=your_key
railway variables set TELEGRAM_BOT_TOKEN=your_token
railway variables set TELEGRAM_CHAT_ID=your_id
railway variables set WALLET_DATA=$(cat data/wallets.enc.json | base64)

# Deploy
railway up
```

The farm runs automatically. You'll get a Telegram message every 8 hours confirming activity.

---

## Security

- **Private keys are AES-256-GCM encrypted** at rest in `data/wallets.enc.json`
- **Never commit `.env` or `data/`** — both are in `.gitignore`
- Use a **dedicated machine or VPS** — not your main computer
- **Back up your mnemonic** (shown once during setup) — store it offline
- Use **small amounts** until you're comfortable — the farm uses 0.0003–0.001 ETH per transaction
- Your computer does **not** need to be on 24/7 if you use Railway

---

## Chains & Why These Three

| Chain | Token? | Why farm it |
|-------|--------|-------------|
| **MegaETH** | Not yet | New mainnet, high activity = likely airdrop |
| **Abstract** | Not yet | Consumer L2, recently launched |
| **Unichain** | Not yet | Uniswap's own L2 — guaranteed ecosystem rewards |

The older chains (Arbitrum, Optimism, zkSync, Scroll, Linea) have already distributed their main airdrops. This farm focuses on the next wave.

---

## Telegram Notifications

Every farming run sends a summary:
```
ℹ️ Airdrop Farmer

Farming Run Complete

Tasks: 6/6 succeeded
Chains: megaeth, abstract, unichain
Gas spent: ~$0.0032
```

---

## Disclaimer

Airdrop farming involves real cryptocurrency. You could lose the ETH you put in through gas fees without receiving any airdrop. Past airdrops do not guarantee future ones. Only use funds you can afford to lose. This is not financial advice.

---

## Contributing

PRs welcome. If you add support for a new chain, open an issue first with the rationale.

## License

MIT
