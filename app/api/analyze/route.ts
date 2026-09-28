import { scoreOpportunity, validateInputs } from "@/lib/opportunity";
export async function POST(request: Request) {
  try {
    const inputs = validateInputs(await request.json());
    return Response.json(scoreOpportunity(inputs, crypto.randomUUID()));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
