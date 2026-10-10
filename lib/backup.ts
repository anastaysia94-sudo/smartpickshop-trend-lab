import { type OpportunityInput, scoreOpportunity } from "./scoring";

export const BACKUP_FORMAT = "smartpickshop-trend-lab:backup";
export const MAX_ROWS = 500;
export const MAX_BYTES = 2_000_000;
export const STORAGE_KEY = "smartpickshop-trend-lab:v1";

export type BackupRow = OpportunityInput & { score: number };
export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: 1;
  exportedAt: string;
  scoringFormula: string;
  items: BackupRow[];
};

export function validateItems(value: unknown): OpportunityInput[] {
  if (!Array.isArray(value) || value.length > MAX_ROWS) {
    throw new Error("Backup must contain at most 500 niches.");
  }
  const ids = new Set<string>();
  return value.map((raw: unknown, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`Niche ${index + 1} is invalid.`);
    }
    const row = raw as Record<string, unknown>;
    if (typeof row.id !== "string" || !row.id.trim() || row.id.length > 200 ||
        typeof row.name !== "string" || !row.name.trim() || row.name.length > 160 ||
        typeof row.evidence !== "string" || row.evidence.length > 10_000) {
      throw new Error(`Niche ${index + 1} has invalid text fields.`);
    }
    const metrics = ["demand", "competition", "urgency", "monetization"] as const;
    for (const metric of metrics) {
      if (typeof row[metric] !== "number" || !Number.isInteger(row[metric]) ||
          (row[metric] as number) < 0 || (row[metric] as number) > 100) {
        throw new Error(`Niche ${index + 1}: ${metric} must be an integer from 0 to 100.`);
      }
    }
    if (ids.has(row.id)) throw new Error("Backup contains duplicate niche IDs.");
    ids.add(row.id);
    const clean: OpportunityInput = {
      id: row.id, name: row.name.trim(),
      demand: row.demand as number, competition: row.competition as number,
      urgency: row.urgency as number, monetization: row.monetization as number,
      evidence: row.evidence
    };
    if ("score" in row && row.score !== scoreOpportunity(clean)) {
      throw new Error(`Niche ${index + 1} has a score inconsistent with its inputs.`);
    }
    return clean;
  });
}

export function createBackup(items: OpportunityInput[]): BackupFile {
  const clean = validateItems(items);
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    scoringFormula: "0.35*demand+0.15*(100-competition)+0.25*urgency+0.25*monetization; round to nearest integer",
    items: clean.map(item => ({ ...item, score: scoreOpportunity(item) }))
  };
}

export function parseBackup(source: unknown): OpportunityInput[] {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new Error("Invalid backup file.");
  }
  const parsed = source as Record<string, unknown>;
  if (parsed.format !== BACKUP_FORMAT || parsed.version !== 1) {
    throw new Error("Unsupported backup format or version.");
  }
  return validateItems(parsed.items);
}
