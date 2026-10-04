import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const MODEL_VERSION = "brief-six-factor-v1";
export const REPORT_ID = "2c84e3f6-0b6f-42b8-96cf-191aded54813";
export const OPPORTUNITY_ID = "d7e24e4a-4f3a-4ea5-8928-c75ca0bc1c85";
export const SEED_SCORE_ID = "abc6c96a-7080-48f2-acce-1f82f607e143";

export type ScoreStatus = "CURRENT" | "STALE";
export type EvidenceStatus = "CHECKED" | "IMPORTED_UNVERIFIED" | "CONFLICTING" | "SNIPPET_ONLY";

export type EvidenceRecord = {
  ref: string;
  sourceId: string;
  evidenceId: string;
  url: string;
  sourceClass: string;
  verificationStatus: EvidenceStatus;
  publishedAt: string | null;
  observedAt: string | null;
  capturedAt: string;
  claim: string;
  snapshot: {
    kind: "observed_claim_snapshot" | "imported_claim_snapshot";
    sha256: string;
    text: string;
  };
};

export type ScoreInput = {
  criterion: string;
  weight: number;
  rating: number;
  evidenceRefs: string[];
  reason: string;
};

export type ScoreRun = {
  id: string;
  modelVersion: string;
  status: ScoreStatus;
  createdAt: string;
  score: number;
  inputHash: string;
  scoreInputs: ScoreInput[];
  explanation: string;
  staleReason?: string;
};

export type ConfidenceRecord = {
  value: number;
  method: string;
  checkedEvidenceCount: number;
  totalEvidenceCount: number;
};

export type TrendReport = {
  reportId: string;
  opportunityId: string;
  projectId: "P020";
  title: string;
  createdAt: string;
  updatedAt: string;
  evidence: EvidenceRecord[];
  scoreRuns: ScoreRun[];
  currentScoreId: string;
  confidence: ConfidenceRecord;
  humanDecision: string;
  contentPlan: string;
  limitations: string[];
};

const CAPTURED_AT = "2026-10-04T12:44:32.405Z";
const CREATED_AT = "2026-10-04T12:44:32.411Z";
const DATA_DIR = process.env.TRENDLAB_DATA_DIR || path.join(process.cwd(), ".trendlab-data");
const STORE_FILE = path.join(DATA_DIR, "p020-q4-report.json");

function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function snapshot(kind: EvidenceRecord["snapshot"]["kind"], text: string) {
  return { kind, sha256: sha256(text), text };
}

const evidenceSeed: Omit<EvidenceRecord, "snapshot">[] = [
  {
    ref: "A1",
    sourceId: "5e328750-d148-4b42-a57b-915bb0af4b28",
    evidenceId: "652a8589-ab21-4017-ae33-9c8b8d5b9dd8",
    url: "https://www.digitalcommerce360.com/2026/09/29/adobe-projection-2026-online-holiday-sales-275-billion/",
    sourceClass: "SECONDARY",
    verificationStatus: "IMPORTED_UNVERIFIED",
    publishedAt: "2026-09-29",
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported brief reports an Adobe holiday forecast of $275.1B and 6.7% growth. Not independently checked in this pass."
  },
  {
    ref: "A2",
    sourceId: "7bef7b8b-b452-41ae-8170-fbe537593a88",
    evidenceId: "64a32bb1-c7a1-4d1c-bb6c-5eca64026d8d",
    url: "https://www.deloitte.com/us/en/about/press-room/deloitte-forecasts-holiday-retail-sales.html",
    sourceClass: "PRIMARY",
    verificationStatus: "CHECKED",
    publishedAt: "2026-09-10",
    observedAt: "2026-10-04T12:32:08Z",
    capturedAt: CAPTURED_AT,
    claim: "Deloitte forecasts holiday e-commerce of $316.1–318.9B, up 7.5–8.4%, for November 2026 through January 2027. Forecast, not realized sales."
  },
  {
    ref: "A3",
    sourceId: "84a83f75-91c0-4bfa-8860-c71cba9b77a5",
    evidenceId: "655fe3ac-e670-4da8-a627-c600513a780f",
    url: "https://www.fastmoss.com/blog/what-to-sell-tiktok-shop-q4-2026/",
    sourceClass: "VENDOR",
    verificationStatus: "IMPORTED_UNVERIFIED",
    publishedAt: "2026-08-21",
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported vendor analysis describes category seasonality and short product lifespans. Full article was not independently confirmed in the fixture."
  },
  {
    ref: "A4",
    sourceId: "5bd92f88-39fc-42cc-bd11-7ce14b6117bd",
    evidenceId: "efc14492-5008-4732-8cac-dbead26f7089",
    url: "https://cordial.com/resources/holiday-2026-consumer-research-data/",
    sourceClass: "VENDOR",
    verificationStatus: "IMPORTED_UNVERIFIED",
    publishedAt: null,
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported survey describes price-sensitive social shoppers. Publication date and claim verification are missing."
  },
  {
    ref: "A5",
    sourceId: "6e6754f9-8555-4260-b5d4-f649cefdc2c3",
    evidenceId: "9d074d3c-a100-4c66-afdb-880c62807ff2",
    url: "https://www.prnewswire.com/news-releases/the-toy-insider-experts-reveal-the-hottest-toys--games-of-2026-in-its-most-affordable-holiday-gift-guide-ever-302888447.html",
    sourceClass: "SPONSORED",
    verificationStatus: "IMPORTED_UNVERIFIED",
    publishedAt: "2026-09-24",
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported sponsored gift guide describes affordable toys. It is not an independent test of performance or demand."
  },
  {
    ref: "A6",
    sourceId: "24e533ce-5240-48d4-a704-9367e7aa711e",
    evidenceId: "45107d09-274d-45aa-b1e0-f8552c454b76",
    url: "https://ecommerce-times.com/tiktok-shops-u-s-affiliate-commission-cuts-are-forcing-seller-rethinks/",
    sourceClass: "CONFLICTING",
    verificationStatus: "CONFLICTING",
    publishedAt: "2026-06-16",
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported commission-cut reports conflict and lack official confirmation. Do not treat reported caps as current policy."
  },
  {
    ref: "A7",
    sourceId: "cb89b057-8568-4924-9712-3875315a6b38",
    evidenceId: "b199caca-f779-48db-9a94-5928a8bca2e5",
    url: "https://www.bebolddigital.com/news/tiktok-shop-8-percent-referral-fee",
    sourceClass: "CONFLICTING",
    verificationStatus: "CONFLICTING",
    publishedAt: "2026-09-08",
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported referral-fee claim conflicts with the reported public table. Seller-specific fee evidence is missing."
  },
  {
    ref: "A8",
    sourceId: "68f4cfef-19e7-4386-8248-bb8ff9b60e86",
    evidenceId: "a0b70fc2-6251-4dca-a0b5-17e4294655fb",
    url: "https://affiliate-program.amazon.com/help/operating/compare",
    sourceClass: "PRIMARY",
    verificationStatus: "IMPORTED_UNVERIFIED",
    publishedAt: null,
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported policy interpretation has not been checked against an archived official version. Effective date is not publication date."
  },
  {
    ref: "A9",
    sourceId: "de1ab508-ffc8-4303-ac73-42c2fc6989b3",
    evidenceId: "3fc08eb2-ce5c-4969-b06c-4953d1763a1c",
    url: "https://www.adweek.com/media/amazon-associates-affiliate-rate-cuts-publishers/",
    sourceClass: "SECONDARY",
    verificationStatus: "IMPORTED_UNVERIFIED",
    publishedAt: null,
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported anonymous publisher reports; exact publication and observation dates are missing."
  },
  {
    ref: "A10",
    sourceId: "4e08c25d-5403-4fc6-ba02-23bcde9733d0",
    evidenceId: "1aaeb40a-12ec-43cf-91b6-63fc559029d0",
    url: "https://www.reddit.com/r/TikTokshop/comments/1ugrszw/",
    sourceClass: "SNIPPET",
    verificationStatus: "SNIPPET_ONLY",
    publishedAt: null,
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Search-snippet anecdotes describe reach and payout problems. Full posts and most dates were not captured; this is not representative demand data."
  },
  {
    ref: "A11",
    sourceId: "5eec7428-1244-4830-9f97-9a7a063dc04b",
    evidenceId: "c2d3f47b-4e74-40c5-94e2-0f8aca503f2d",
    url: "https://www.hubfluence.io/blog/tiktok-shop-creator-tool-pricing",
    sourceClass: "VENDOR",
    verificationStatus: "IMPORTED_UNVERIFIED",
    publishedAt: "2026-09-26",
    observedAt: null,
    capturedAt: CAPTURED_AT,
    claim: "Imported vendor tool-price list. List prices do not establish actual payments or demand for research briefs."
  }
];

const scoreInputsSeed: ScoreInput[] = [
  { criterion: "Problem evidence", weight: 25, rating: 4, evidenceRefs: ["A3", "A6", "A10"], reason: "Short product lifespans, reported commission cuts, and reach/payout complaints make selection harder." },
  { criterion: "Buyer and payment signal", weight: 25, rating: 3, evidenceRefs: ["A11"], reason: "Paid research tools exist, but there is no direct evidence of paying for one-off briefs." },
  { criterion: "Reachable channel", weight: 15, rating: 4, evidenceRefs: ["A10"], reason: "Creator communities are reachable, while anecdotal evidence remains weak." },
  { criterion: "Delivery economics", weight: 15, rating: 4, evidenceRefs: [], reason: "Founder assumption: public data plus a reusable template can support low marginal delivery cost." },
  { criterion: "Timing and urgency", weight: 10, rating: 5, evidenceRefs: ["A2", "A3"], reason: "Holiday deadlines create a narrow, time-sensitive decision window." },
  { criterion: "Risk (5 = low risk)", weight: 10, rating: 2, evidenceRefs: ["A6", "A7", "A10"], reason: "Platform volatility, unverified policy changes, and short shelf life increase risk." }
];

export function calculateScore(inputs: ScoreInput[]) {
  const totalWeight = inputs.reduce((sum, input) => sum + input.weight, 0);
  if (totalWeight !== 100) throw new Error(`Score weights must total 100, got ${totalWeight}`);
  for (const input of inputs) {
    if (input.rating < 1 || input.rating > 5) throw new Error(`Rating out of range for ${input.criterion}`);
  }
  return Math.round(inputs.reduce((sum, input) => sum + (input.rating * input.weight) / 5, 0));
}

export function calculateInputHash(inputs: ScoreInput[]) {
  return sha256(stableStringify({ modelVersion: MODEL_VERSION, scoreInputs: inputs }));
}

function buildScoreRun(id: string, createdAt: string, inputs: ScoreInput[]): ScoreRun {
  return {
    id,
    modelVersion: MODEL_VERSION,
    status: "CURRENT",
    createdAt,
    score: calculateScore(inputs),
    inputHash: calculateInputHash(inputs),
    scoreInputs: inputs,
    explanation: "Formula: sum(rating × percentage weight ÷ 5). All six ratings are research judgments; delivery economics is an explicit founder assumption."
  };
}

export function createSeedReport(): TrendReport {
  const evidence = evidenceSeed.map((record) => ({
    ...record,
    snapshot: snapshot(record.verificationStatus === "CHECKED" ? "observed_claim_snapshot" : "imported_claim_snapshot", record.claim)
  }));
  const checkedEvidenceCount = evidence.filter((record) => record.verificationStatus === "CHECKED").length;
  const firstRun = buildScoreRun(SEED_SCORE_ID, CREATED_AT, scoreInputsSeed.map((input) => ({ ...input, evidenceRefs: [...input.evidenceRefs] })));
  return {
    reportId: REPORT_ID,
    opportunityId: OPPORTUNITY_ID,
    projectId: "P020",
    title: "SmartPickShop Trend Lab — Q4 Gift Niche Validator",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    evidence,
    scoreRuns: [firstRun],
    currentScoreId: firstRun.id,
    confidence: {
      value: checkedEvidenceCount / evidence.length,
      method: "directly checked cited evidence records divided by total cited evidence records; this is coverage, not probability of success",
      checkedEvidenceCount,
      totalEvidenceCount: evidence.length
    },
    humanDecision: "HOLD: validate source claims and one direct buyer/payment signal before distribution or inventory spend.",
    contentPlan: "Draft one recipient × price-band guide. Cite dated evidence, label forecasts and vendor observations, and avoid unconfirmed policy claims. Refresh product and shipping facts before publication.",
    limitations: [
      "73/100 is a provisional opportunity assessment, not verified market demand.",
      "Only one of eleven cited evidence records was directly checked in the seed fixture.",
      "Delivery economics is a founder assumption; no measured labor cost or direct brief purchase is recorded.",
      "Conflicting policy claims remain labeled conflicting until primary evidence is captured."
    ]
  };
}

async function writeReport(report: TrendReport) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(report, null, 2), "utf8");
  await rename(tmp, STORE_FILE);
  return report;
}

export async function resetReport() {
  return writeReport(createSeedReport());
}

export async function readReport() {
  try {
    const report = JSON.parse(await readFile(STORE_FILE, "utf8")) as TrendReport;
    if (!report.reportId || !Array.isArray(report.scoreRuns)) throw new Error("invalid report store");
    return report;
  } catch {
    return resetReport();
  }
}

export async function mutateRiskRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("riskRating must be an integer from 1 to 5");
  const report = await readReport();
  const current = report.scoreRuns.find((run) => run.id === report.currentScoreId);
  if (!current) throw new Error("Current score run not found");

  const nextInputs = current.scoreInputs.map((input) => input.criterion === "Risk (5 = low risk)" ? { ...input, rating } : { ...input, evidenceRefs: [...input.evidenceRefs] });
  const nextHash = calculateInputHash(nextInputs);
  if (nextHash === current.inputHash) return report;

  current.status = "STALE";
  current.staleReason = "A material score input changed; the prior score is preserved as immutable history.";
  const nextRun = buildScoreRun(randomUUID(), new Date().toISOString(), nextInputs);
  report.scoreRuns.push(nextRun);
  report.currentScoreId = nextRun.id;
  report.updatedAt = nextRun.createdAt;
  return writeReport(report);
}

export function currentScore(report: TrendReport) {
  const run = report.scoreRuns.find((candidate) => candidate.id === report.currentScoreId);
  if (!run) throw new Error("Current score run not found");
  return run;
}

export function exportManifest(report: TrendReport) {
  return {
    reportId: report.reportId,
    opportunityId: report.opportunityId,
    projectId: report.projectId,
    title: report.title,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    humanDecision: report.humanDecision,
    confidence: report.confidence,
    currentScore: currentScore(report),
    scoreHistory: report.scoreRuns,
    evidence: report.evidence,
    contentPlan: report.contentPlan,
    limitations: report.limitations
  };
}

export function exportMarkdown(report: TrendReport) {
  const score = currentScore(report);
  const evidenceLines = report.evidence.map((record) =>
    `### ${record.ref} — ${record.sourceClass} — ${record.verificationStatus}\n${record.url}\n${record.claim}\nPublished: ${record.publishedAt ?? "unknown"}; observed: ${record.observedAt ?? "unknown"}; captured: ${record.capturedAt}\nEvidence UUID: ${record.evidenceId}; source UUID: ${record.sourceId}; snapshot SHA-256: ${record.snapshot.sha256}`
  ).join("\n\n");
  const scoreRows = score.scoreInputs.map((input) =>
    `| ${input.criterion} | ${input.weight}% | ${input.rating}/5 | ${input.evidenceRefs.join(", ") || "Founder assumption"} |`
  ).join("\n");
  return `# ${report.title}

Report: ${report.reportId}
Opportunity: ${report.opportunityId}
Score run: ${score.id}
Created (UTC): ${report.createdAt}

**Provisional opportunity score: ${score.score}/100. Verified citation coverage: ${report.confidence.value.toFixed(3)}/1.**

## Decision
${report.humanDecision}

## Scoring
Model: ${score.modelVersion}
Input hash (SHA-256): ${score.inputHash}

| Criterion | Weight | Rating | Evidence |
| --- | ---: | ---: | --- |
${scoreRows}

## Evidence and limitations

${evidenceLines}

## Content plan
${report.contentPlan}

## Limitations
${report.limitations.map((item) => `- ${item}`).join("\n")}

## Score history
${report.scoreRuns.map((run) => `- ${run.id}: ${run.score}/100 — ${run.status} — ${run.inputHash}${run.staleReason ? ` — ${run.staleReason}` : ""}`).join("\n")}
`;
}
