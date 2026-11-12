# VeriSense

**An AI-Assisted Social Media Self-Audit, Fact-Checking, and Cognitive Media Literacy Engine**

VeriSense audits a user's own social media posts to detect scientific and financial misinformation, cross-references claims against peer-reviewed literature, and diagnoses the rhetorical and cognitive triggers that lead users to believe and share misleading content.

---

## Core Objectives & Domain Guardrails

* **Self-Auditing Media Literacy:** Designed as a personal feedback loop—analyzing posts authored or shared by the user to highlight credibility blind spots rather than acting solely as an external moderation tool.
* **Strict Domain Scope:** Restricted exclusively to **Science** (health, medicine, climate, technology) and **Finance** (investing, personal finance, economic claims).
* **Explicit Exclusions:** Automatically filters out and discards **Political** and **Religious** discourse at the ingestion gate to maintain objective, evidence-based verification.

---

## System Architecture

### Phase 1: Diagnostic & Verification Pipeline *(Current MVP v0.1)*
1. **Feed Ingestion:** Fetches public posts from a target social profile via the **Bluesky Public AppView API** (`app.bsky.feed.getAuthorFeed`) or accepts raw post batches via a manual/feed input interface.
2. **Scope Enforcement Gate:** Classifies each post by domain and immediately excludes non-eligible content (Politics, Religion, General chatter) while tracking exclusion metrics.
3. **Claim & Trigger Extraction:** Uses **Google Gemini (`gemini-3.8-flash` with fallback resilience)** via structured JSON schemas to extract core verifiable claims and tag persuasion/manipulation tactics (e.g., *False Certainty*, *Guaranteed Returns*, *Sensationalism*, *Cherry-Picked Data*).
4. **Evidence Grounding:** Queries the **NCBI PubMed E-utilities API** for eligible scientific claims to ground credibility verdicts (`Supported`, `Contradicted`, `Misleading / Missing Context`, `Unverified`) in peer-reviewed literature.

### Phase 2: Multi-Platform & Personalized Learning Engine *(Planned Roadmap)*
* **Cross-Platform Ingestion:** Expand beyond Bluesky using a **Manifest V3 Browser Extension** (reading authenticated user profile DOMs on X and Instagram without enterprise API paywalls) and **Official Data Archive Uploaders** (`tweets.js` and Instagram JSON exports).
* **Cognitive Vulnerability Profiling:** Aggregate flagged posts and recurring manipulation tags per user in **PostgreSQL** to map personal blind spots (e.g., susceptibility to preliminary health claims or FOMO-driven financial framing).
* **Targeted Micro-Learning & Inoculation:** Generate personalized root-cause breakdowns, interactive spot-the-flaw drills, and curated educational video recommendations explaining *why* a post was persuasive and how to verify similar claims before sharing.

---

## Tech Stack

* **Backend:** Python, FastAPI, Uvicorn, HTTPX, Pydantic
* **AI & Grounding:** Google GenAI SDK (`gemini-3.8-flash` / `gemini-3.8-flash-lite`), NCBI PubMed E-utilities API
* **Social Ingestion:** Bluesky AT Protocol Public AppView API
* **Frontend:** React, Vite, Axios

---

## Project Structure

```text
VeriSense/
├── .gitignore
├── README.md
├── backend/
│   ├── main.py             # FastAPI endpoints (/api/scan/bluesky, /api/scan/manual)
│   ├── pipeline.py         # Ingestion, Science/Finance scope gate, PubMed & LLM pipeline
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables (ignored by Git)
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx         # Single-page verification dashboard
        └── main.jsx