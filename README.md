# Backlink Evaluator

AI-powered backlink relationship scoring using Claude. Evaluates source → target link value across 4 pillars: Authority, Topical Alignment, Toxicity, and Agentic Utility.

## Setup

### 1. Clone & Install
```bash
git clone <your-repo>
cd backlink-evaluator
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Add your Anthropic API key to .env.local
```

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

## Deploy to Railway

1. Push to GitHub
2. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variable: `ANTHROPIC_API_KEY=your_key`
5. Railway auto-detects Next.js and deploys

## How It Works

1. Enter source URL (linking domain) and target URL (your domain)
2. Claude uses web search to research both domains
3. Scores are generated across 4 pillars
4. A composite Link Value (LV) 0–100 is produced with a recommendation: **Acquire / Monitor / Avoid**

## Scoring Model

| Pillar | Weight | What it measures |
|---|---|---|
| Source Authority | ~30% | Domain age, indexing, brand presence, reputation |
| Topical Alignment | ~25% | Niche proximity, audience overlap, link purpose logic |
| Toxicity Risk | Veto | PBN signals, link schemes, spam — TOXIC = auto-reject |
| Agentic Utility | ~45% | Citation value, KG association, entity reinforcement |
