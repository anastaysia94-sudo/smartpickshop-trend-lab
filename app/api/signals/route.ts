import { getChatGPTUser } from "@/app/chatgpt-auth";

type HNHit = { objectID?: string; title?: string | null; story_title?: string | null; comment_text?: string | null; created_at?: string | null; author?: string | null };

export async function GET(request: Request) {
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in to research a niche." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 90) return Response.json({ error: "Enter a search of 2–90 characters." }, { status: 400 });
  const since = Math.floor(Date.now() / 1000) - 365 * 86400;
  const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
  url.searchParams.set("query", query);
  url.searchParams.set("tags", "comment");
  url.searchParams.set("numericFilters", `created_at_i>${since}`);
  url.searchParams.set("hitsPerPage", "8");
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(7000), headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Search unavailable");
    const data = await response.json() as { hits?: HNHit[] };
    const signals = (data.hits ?? []).filter(hit => /^\d+$/.test(hit.objectID ?? "") && hit.created_at).map(hit => ({
      title: (hit.story_title || hit.title || "Hacker News discussion").slice(0, 160),
      excerpt: (hit.comment_text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260),
      date: hit.created_at,
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "Hacker News comment",
    }));
    return Response.json({ signals, query, searchedAt: new Date().toISOString() });
  } catch {
    return Response.json({ error: "Live discussions could not be fetched. Your saved niches are still available." }, { status: 503 });
  }
}
