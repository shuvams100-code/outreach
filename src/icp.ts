// Turn an account's plain-English ICP ("we sell to independent insurance brokers") into a short
// search term for the scrapers ("insurance brokers"). So onboarding = write the ICP + toggle sources;
// the search query derives itself. Reuses the same free OpenRouter models as enrichment.

const LLM_MODELS = ["openai/gpt-oss-120b:free", "openai/gpt-oss-20b:free"];

// Returns a concise directory-style search term, or null if it can't (no key / LLM unavailable).
export async function deriveSearchTerm(icpDescription: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || !icpDescription?.trim()) return null;

  const prompt = `A business describes its ideal customer below. Reply with ONLY the 1-4 word business
category to search for in a business directory (Yellow Pages / Google Maps) to find them. No quotes,
no explanation, just the search term.

Ideal customer: ${icpDescription}

Search term:`;

  for (const model of LLM_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0 }),
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429) continue;
      if (!res.ok) continue;
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const term = cleanTerm(data.choices?.[0]?.message?.content ?? "");
      if (term) return term;
    } catch {
      continue;
    }
  }
  return null;
}

// Pure (unit-tested): strip quotes/prefixes/punctuation the model sometimes adds; keep it short.
export function cleanTerm(raw: string): string | null {
  let t = raw.trim().replace(/^search term:\s*/i, "").replace(/^["'`]+|["'`.]+$/g, "").trim();
  if (!t) return null;
  // Guard against the model returning a sentence — keep at most the first 5 words.
  t = t.split(/\s+/).slice(0, 5).join(" ");
  return t || null;
}
