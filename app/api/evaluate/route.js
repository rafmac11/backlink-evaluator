import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert SEO analyst specializing in backlink quality evaluation. 
You must ALWAYS respond with a single valid JSON object only.
Do NOT include any text before or after the JSON.
Do NOT use markdown code blocks.
Your entire response must be parseable by JSON.parse().`;

const buildPrompt = (sourceUrl, targetUrl) => `
Evaluate the backlink relationship between:
- SOURCE (linking site): ${sourceUrl}
- TARGET (receiving the link): ${targetUrl}

Research both domains thoroughly using web search. Investigate:
1. Domain age, indexed pages, brand search presence, Knowledge Panel, social presence, Wayback Machine history, third-party mentions (Yelp, BBB, etc.)
2. Niche/topical relationship between source and target, audience overlap, entity co-occurrence, link purpose logic
3. Toxicity signals: PBN patterns, link schemes, doorway pages, guest post farming, spam indicators, public reputation
4. Agentic/traffic utility: citation value, Knowledge Graph association benefit, entity node reinforcement, semantic clustering impact, conversion alignment

Return ONLY this JSON structure (no markdown, no code blocks):

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
