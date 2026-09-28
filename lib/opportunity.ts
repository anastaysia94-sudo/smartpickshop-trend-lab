export type Inputs = { name: string; demand: number; competition: number; urgency: number; monetization: number; evidence: string };
export type Opportunity = Inputs & { id: string; competitionAdvantage: number; score: number; explanation: string };
export const weights = { demand: 0.35, competitionAdvantage: 0.15, urgency: 0.25, monetization: 0.25 } as const;

export function validateInputs(value: unknown): Inputs {
  if (!value || typeof value !== "object") throw new Error("Enter a niche and four scores.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const evidence = typeof input.evidence === "string" ? input.evidence.trim() : "";
  if (name.length < 2 || name.length > 90) throw new Error("Niche name must be 2–90 characters.");
  if (evidence.length > 500) throw new Error("Evidence notes must be 500 characters or fewer.");
  for (const key of ["demand", "competition", "urgency", "monetization"] as const) {
    const score = input[key];
    if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error(`${key} must be a whole number from 0 to 100.`);
    }
  }
  return { name, evidence, demand: input.demand as number, competition: input.competition as number,
    urgency: input.urgency as number, monetization: input.monetization as number };
}

export function scoreOpportunity(input: Inputs, id: string): Opportunity {
  const competitionAdvantage = 100 - input.competition;
  const score = Math.round(input.demand * weights.demand + competitionAdvantage * weights.competitionAdvantage +
    input.urgency * weights.urgency + input.monetization * weights.monetization);
  const parts = [["demand", input.demand], ["competition advantage", competitionAdvantage],
    ["urgency", input.urgency], ["monetization", input.monetization]] as const;
  const strongest = [...parts].sort((a, b) => b[1] - a[1])[0][0];
  return { ...input, id, competitionAdvantage, score,
    explanation: `This scores ${score}/100 based on the estimates entered. ${strongest[0].toUpperCase()}${strongest.slice(1)} is its strongest input. Competition is reversed: ${input.competition}/100 competition becomes ${competitionAdvantage}/100 competition advantage. This is a comparison aid, not a verified demand or profit forecast.` };
}

export const examples: Opportunity[] = [
  scoreOpportunity({ name: "Local business lead briefs", demand: 72, competition: 61, urgency: 78, monetization: 68, evidence: "Illustrative estimates. Add real buyer requests and source links before making a decision." }, "demo-leads"),
  scoreOpportunity({ name: "Remote job application toolkit", demand: 66, competition: 73, urgency: 74, monetization: 55, evidence: "Illustrative estimates. Add real buyer requests and source links before making a decision." }, "demo-career"),
  scoreOpportunity({ name: "Printable project planner", demand: 57, competition: 49, urgency: 45, monetization: 63, evidence: "Illustrative estimates. Add real buyer requests and source links before making a decision." }, "demo-planner"),
];
