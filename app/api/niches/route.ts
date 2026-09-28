import { and, desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { niches } from "@/db/schema";
import { scoreOpportunity, validateInputs } from "@/lib/opportunity";

const unauthorized = () => Response.json({ error: "Sign in to save niches." }, { status: 401 });
const unavailable = () => Response.json({ error: "Saved niches are temporarily unavailable. Your changes were not saved." }, { status: 503 });

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();
  try {
    const rows = await getDb().select().from(niches).where(eq(niches.ownerId, user.userId)).orderBy(desc(niches.updatedAt)).limit(100);
    return Response.json({ niches: rows.map(row => scoreOpportunity(row, row.id)) });
  } catch { return unavailable(); }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();
  try {
    const input = validateInputs(await request.json());
    const id = crypto.randomUUID();
    await getDb().insert(niches).values({ ...input, id, ownerId: user.userId, updatedAt: new Date().toISOString() });
    return Response.json(scoreOpportunity(input, id), { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && /niche|score|evidence|demand|competition|urgency|monetization/i.test(error.message))
      return Response.json({ error: error.message }, { status: 400 });
    return unavailable();
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json() as { id?: unknown };
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) return Response.json({ error: "Invalid niche ID." }, { status: 400 });
    const input = validateInputs(body);
    const updated = await getDb().update(niches).set({ ...input, updatedAt: new Date().toISOString() })
      .where(and(eq(niches.id, body.id), eq(niches.ownerId, user.userId))).returning({ id: niches.id });
    if (!updated.length) return Response.json({ error: "Niche not found." }, { status: 404 });
    return Response.json(scoreOpportunity(input, body.id));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && /niche|score|evidence|demand|competition|urgency|monetization/i.test(error.message))
      return Response.json({ error: error.message }, { status: 400 });
    return unavailable();
  }
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid niche ID." }, { status: 400 });
    const removed = await getDb().delete(niches).where(and(eq(niches.id, id), eq(niches.ownerId, user.userId))).returning({ id: niches.id });
    if (!removed.length) return Response.json({ error: "Niche not found." }, { status: 404 });
    return Response.json({ removed: id });
  } catch { return unavailable(); }
}
