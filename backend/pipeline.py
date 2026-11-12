import os
import json
import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

BSKY_PUBLIC_API = "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed"
PUBMED_ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"


class PostAnalysis(BaseModel):
    domain: str = Field(
        description="Must be one of: Science, Finance, Politics, Religion, Other"
    )
    is_eligible: bool = Field(
        description="True ONLY if domain is Science or Finance and primary topic is NOT political or religious."
    )
    exclusion_reason: str = Field(
        description="If is_eligible is False, brief reason (e.g., 'Political content excluded'). Otherwise empty string."
    )
    extracted_claim: str = Field(
        description="Core factual claim extracted from the post, or 'No verifiable factual claim' if opinion."
    )
    search_keywords: str = Field(
        description="2-4 concise keywords to search PubMed or financial facts if eligible, else empty."
    )
    manipulation_techniques: list[str] = Field(
        description="Observable techniques e.g. ['Guaranteed Returns', 'False Certainty', 'Cherry-Picked Data', 'Sensationalism'] or ['None detected']"
    )
    verdict: str = Field(
        description="One of: Supported, Contradicted, Misleading / Missing Context, Unverified (Insufficient Evidence), Not Assessable"
    )
    explanation: str = Field(
        description="2-3 sentence evidence-grounded explanation educating the user on how this claim works or misleads."
    )


async def fetch_bluesky_posts(handle: str, limit: int = 12) -> list[dict]:
    clean_handle = handle.strip().lstrip("@")
    async with httpx.AsyncClient(timeout=15.0) as http:
        resp = await http.get(
            BSKY_PUBLIC_API,
            params={"actor": clean_handle, "limit": limit, "filter": "posts_no_replies"},
        )
        resp.raise_for_status()
        data = resp.json()

    posts = []
    for item in data.get("feed", []):
        post = item.get("post", {})
        record = post.get("record", {})
        text = record.get("text", "").strip()
        if text:
            posts.append({
                "id": post.get("uri", ""),
                "text": text,
                "created_at": record.get("createdAt", ""),
                "author": post.get("author", {}).get("handle", clean_handle),
            })
    return posts


async def fetch_pubmed_evidence(keywords: str) -> list[dict]:
    if not keywords:
        return []
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            search_resp = await http.get(
                PUBMED_ESEARCH,
                params={"db": "pubmed", "term": keywords, "retmax": 2, "retmode": "json"},
            )
            pmids = search_resp.json().get("esearchresult", {}).get("idlist", [])
            if not pmids:
                return []

            sum_resp = await http.get(
                PUBMED_ESUMMARY,
                params={"db": "pubmed", "id": ",".join(pmids), "retmode": "json"},
            )
            result = sum_resp.json().get("result", {})
            evidence = []
            for pmid in pmids:
                article = result.get(pmid, {})
                if article.get("title"):
                    evidence.append({
                        "title": article["title"],
                        "source": article.get("source", "PubMed"),
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                    })
            return evidence
    except Exception:
        return []


def analyze_post_with_llm(text: str, evidence_context: str = "") -> dict:
    prompt = f"""
You are VeriSense, an AI media literacy engine strictly restricted to SCIENTIFIC and FINANCIAL information.

STRICT SCOPE RULES:
1. Classify the post into: Science, Finance, Politics, Religion, or Other.
2. EXCLUDE (is_eligible = false) any post that involves politics, government policy debates, elections, religion, or general chatter—even if it mentions science or money.
3. Only posts strictly about scientific/health claims or financial/investment claims get is_eligible = true.
4. For eligible posts, extract the factual claim, identify observable persuasion/manipulation techniques, and evaluate credibility based on retrieved evidence and established consensus. Do not mark a claim false merely for lacking evidence; use 'Unverified (Insufficient Evidence)' when appropriate.

Retrieved Reference Context (if any):
{evidence_context if evidence_context else "None retrieved yet."}

Post Text:
\"\"\"{text}\"\"\"
"""
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PostAnalysis,
            temperature=0.1,
        ),
    )
    return json.loads(response.text)


async def run_pipeline(posts: list[dict]) -> dict:
    eligible_results = []
    excluded_results = []

    for post in posts:
        initial = analyze_post_with_llm(post["text"])

        if not initial["is_eligible"] or initial["domain"] not in ("Science", "Finance"):
            excluded_results.append({
                "text": post["text"],
                "domain": initial["domain"],
                "reason": initial["exclusion_reason"] or f"Out of scope ({initial['domain']})",
            })
            continue

        evidence_links = []
        if initial["domain"] == "Science" and initial["search_keywords"]:
            evidence_links = await fetch_pubmed_evidence(initial["search_keywords"])
            if evidence_links:
                evidence_str = "\n".join(
                    [f"- {e['title']} ({e['url']})" for e in evidence_links]
                )
                initial = analyze_post_with_llm(post["text"], evidence_str)

        eligible_results.append({
            "text": post["text"],
            "author": post.get("author", "Manual Input"),
            "analysis": initial,
            "evidence_links": evidence_links,
        })

    return {
        "summary": {
            "total_scanned": len(posts),
            "eligible_count": len(eligible_results),
            "excluded_count": len(excluded_results),
        },
        "eligible_posts": eligible_results,
        "excluded_posts": excluded_results,
    }