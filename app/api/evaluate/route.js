import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert SEO analyst helping evaluate whether a backlink opportunity is worth pursuing.

Your job: Evaluate whether the SOURCE domain is a high-quality site worth getting a link FROM.
The TARGET is your client's site that will RECEIVE the link — do not penalize or judge the target.

Focus your evaluation entirely on the SOURCE domain:
- Is the source a real, legitimate website with real traffic and content?
- Does the source have topical relevance to the target's industry?
- Is the source free from spam, PBN, or link scheme signals?
- Would a real user on the source site find a link to the target useful?

CRITICAL GUIDELINES:
- Multi-location businesses with shared branding across states/cities are NORMAL — not a PBN signal
- Typo or unusual domain names alone are NOT toxic. If the site ranks well, treat it as legitimate
- Shared email domains and templated content across locations = standard multi-location business practice
- Small link profiles on local business sites are completely normal
- REAL PBN signals: no real address/phone, no reviews, hidden whois, bulk-created sites, content exists ONLY to pass links
- If a site ranks on page 1 in Google it has passed quality filters — weight this heavily
- The TARGET is your client seeking links — evaluate it charitably, focus suspicion only on the SOURCE

You must ALWAYS respond with a single valid JSON object only.
Do NOT include any text before or after the JSON.
Do NOT use markdown code blocks.
Your entire response must be parseable by JSON.parse().`;

const buildPrompt = (sourceUrl, targetUrl) => `
Evaluate this backlink opportunity:
- SOURCE (the site that would GIVE the link): ${sourceUrl}
- TARGET (your client's site that would RECEIVE the link): ${targetUrl}

Your task: Determine if the SOURCE is worth getting a link from for the TARGET.
Judge the SOURCE critically. Treat the TARGET as your client — do not penalize it.

Research the SOURCE domain thoroughly:
1. Is it a real legitimate website? Real business, real content, real traffic, real social presence?
2. Is it topically relevant to the target's industry? Would a link make sense to a real user?
3. Are there any spam or manipulation signals on the SOURCE?
4. Would this link provide real value — trust, authority, referral traffic?

Return ONLY this JSON structure:

{
  "source_url": "${sourceUrl}",
  "target_url": "${targetUrl}",
  "source_authority": {
    "score": 0.0,
    "findings": {
      "domain_age": "",
      "indexing_stability": "",
      "brand_search_presence": "",
      "social_signals": "",
      "third_party_mentions": "",
      "entity_recognition": ""
    },
    "summary": ""
  },
  "topical_alignment": {
    "score": 0.0,
    "findings": {
      "primary_niche_match": "",
      "audience_overlap": "",
      "semantic_keyword_overlap": "",
      "link_purpose_validation": "",
      "entity_co_occurrence": "",
      "competitive_context": ""
    },
    "summary": ""
  },
  "toxicity_risk": {
    "flag": "CLEAN",
    "findings": {
      "pbn_signals": "",
      "link_scheme_patterns": "",
      "content_quality": "",
      "public_reputation": "",
      "tld_trust": ""
    },
    "summary": ""
  },
  "agentic_utility": {
    "score": 0.0,
    "findings": {
      "citation_utility": "",
      "knowledge_graph_association": "",
      "entity_node_reinforcement": "",
      "trust_by_association": "",
      "contextual_conversion_alignment": ""
    },
    "summary": ""
  },
  "final": {
    "composite_lv": 0.0,
    "recommendation": "Acquire",
    "reasoning": ""
  }
}

Scores are 0.0–1.0. toxicity flag is "CLEAN", "CAUTION", or "TOXIC". 
Recommendation is "Acquire", "Monitor", or "Avoid".
If toxicity flag is TOXIC, composite_lv must be 0.0 and recommendation must be "Avoid".
`;

export async function POST(req) {
  try {
    const { sourceUrl, targetUrl } = await req.json();

    if (!sourceUrl || !targetUrl) {
      return Response.json({ error: "Both source and target URLs are required." }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(sourceUrl, targetUrl) }],
    });

    // Extract the final text block (after tool use)
    const textBlock = response.content.filter((b) => b.type === "text").pop();

    if (!textBlock || !textBlock.text.trim()) {
      // If no text block, Claude may have stopped after tool use — retry without tools
      const retry = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildPrompt(sourceUrl, targetUrl) }],
      });
      const retryText = retry.content.filter((b) => b.type === "text").pop();
      if (!retryText) return Response.json({ error: "No response from Claude." }, { status: 500 });
      const retryRaw = retryText.text.replace(/```json|```/g, "").trim();
      const retryMatch = retryRaw.match(/\{[\s\S]*\}/);
      if (!retryMatch) return Response.json({ error: "Could not parse Claude response as JSON." }, { status: 500 });
      return Response.json(JSON.parse(retryMatch[0]));
    }

    // Strip any accidental markdown fences and extract JSON
    const raw = textBlock.text.replace(/```json|```/g, "").trim();
    
    // Try to extract JSON object if there's surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const result = JSON.parse(jsonMatch[0]);
    return Response.json(result);
  } catch (err) {
    console.error("Evaluation error:", err);
    return Response.json({ error: err.message || "Evaluation failed." }, { status: 500 });
  }
}
