"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowUpRight, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Opportunity } from "@/lib/opportunity";

type Draft = { name: string; demand: string; competition: string; urgency: string; monetization: string; evidence: string };
type Signal = { title: string; excerpt: string; date: string; url: string; source: string };
const empty: Draft = { name: "", demand: "50", competition: "50", urgency: "50", monetization: "50", evidence: "" };
const fields = [
  { key: "demand", label: "Demand", hint: "How much interest or buyer need is there?", weight: "35%" },
  { key: "competition", label: "Competition", hint: "How crowded is this niche? Higher reduces the total.", weight: "15% reversed" },
  { key: "urgency", label: "Urgency", hint: "How soon do buyers need a solution?", weight: "25%" },
  { key: "monetization", label: "Monetization", hint: "How clear is the path to payment?", weight: "25%" },
] as const;

async function analyze(draft: Draft): Promise<Opportunity> {
  const body = { ...draft, demand: Number(draft.demand), competition: Number(draft.competition),
    urgency: Number(draft.urgency), monetization: Number(draft.monetization) };
  for (const field of fields) {
    if (draft[field.key].trim() === "") throw new Error(`${field.label} needs a score from 0 to 100.`);
  }
  const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as Opportunity & { error?: string };
  if (!response.ok) throw new Error(result.error || "Could not score this niche.");
  return result as Opportunity;
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  return <div className="flex items-center gap-3" aria-label={`${label}: ${value} of 100`}>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#d5e5dc]"><div className="h-full rounded-full bg-[#087f81]" style={{ width: `${value}%` }} /></div>
    <strong className="w-9 text-right text-sm tabular-nums">{value}</strong>
  </div>;
}

export function Workspace({ initial }: { initial: Opportunity[] }) {
  const [items, setItems] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedStatus, setSavedStatus] = useState("Loading saved niches…");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalError, setSignalError] = useState("");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => [...items].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)), [items]);
  const selected = items.find(item => item.id === selectedId) ?? sorted[0];

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => {});
    void fetch("/api/niches", { cache: "no-store" }).then(async response => {
      const data = await response.json() as { niches?: Opportunity[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Saved niches unavailable.");
      const saved = data.niches ?? [];
      setItems(current => [...saved, ...current.filter(item => item.id.startsWith("demo-"))]);
      if (saved.length) setSelectedId(saved[0].id);
      setSavedStatus(`${saved.length} saved ${saved.length === 1 ? "niche" : "niches"}`);
    }).catch((failure: unknown) => setSavedStatus(failure instanceof Error ? failure.message : "Saved niches unavailable."));
  }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: object, options: { signal: AbortSignal }) => Promise<void> | void } }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "add_niche", title: "Add a niche to Trend Lab", description: "Score a niche from entered estimates and save it privately.",
      inputSchema: { type: "object", properties: { name: { type: "string" }, demand: { type: "integer", minimum: 0, maximum: 100 }, competition: { type: "integer", minimum: 0, maximum: 100 }, urgency: { type: "integer", minimum: 0, maximum: 100 }, monetization: { type: "integer", minimum: 0, maximum: 100 }, evidence: { type: "string" } }, required: ["name", "demand", "competition", "urgency", "monetization"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(value: unknown) {
        const input = value as Partial<Record<keyof Draft, string | number>>;
        const next: Draft = { name: String(input.name ?? ""), demand: String(input.demand ?? ""), competition: String(input.competition ?? ""), urgency: String(input.urgency ?? ""), monetization: String(input.monetization ?? ""), evidence: String(input.evidence ?? "") };
        const response = await fetch("/api/niches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...next, demand: Number(next.demand), competition: Number(next.competition), urgency: Number(next.urgency), monetization: Number(next.monetization) }) });
        const result = await response.json() as Opportunity & { error?: string };
        if (!response.ok) throw new Error(result.error || "Could not save niche.");
        setItems(current => [...current, result]); setSelectedId(result.id);
        return { name: result.name, score: result.score, explanation: result.explanation };
      },
    }, { signal: controller.signal })).catch(() => {});
    return () => controller.abort();
  }, []);

  function startEditing(item: Opportunity) {
    setSelectedId(item.id); setEditingId(item.id); setError("");
    setDraft({ name: item.name, demand: String(item.demand), competition: String(item.competition),
      urgency: String(item.urgency), monetization: String(item.monetization), evidence: item.evidence });
  }
  function startNew() { setEditingId(null); setDraft(empty); setError(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await analyze(draft);
      const update = editingId && !editingId.startsWith("demo-");
      const response = await fetch("/api/niches", { method: update ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, id: editingId, demand: Number(draft.demand), competition: Number(draft.competition), urgency: Number(draft.urgency), monetization: Number(draft.monetization) }) });
      const result = await response.json() as Opportunity & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save niche.");
      setItems(current => update ? current.map(item => item.id === editingId ? result : item) : [...current.filter(item => item.id !== editingId), result]);
      setSelectedId(result.id); setEditingId(null); setDraft(empty); setSavedStatus("Changes saved privately");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not score this niche."); }
    finally { setBusy(false); }
  }
  async function removeSelected() {
    if (!selected) return;
    if (!selected.id.startsWith("demo-")) {
      setBusy(true); setError("");
      try {
        const response = await fetch(`/api/niches?id=${encodeURIComponent(selected.id)}`, { method: "DELETE" });
        if (!response.ok) { const result = await response.json() as { error?: string }; throw new Error(result.error || "Could not remove niche."); }
      } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not remove niche."); setBusy(false); return; }
      setBusy(false); setSavedStatus("Niche removed from private storage");
    }
    const remaining = items.filter(item => item.id !== selected.id);
    setItems(remaining); setSelectedId(remaining[0]?.id ?? ""); startNew();
  }

  async function searchSignals() {
    const term = (query.trim() || selected?.name || "").slice(0, 90);
    if (term.length < 2) { setSignalError("Choose a niche or enter a search of at least two characters."); return; }
    setSearching(true); setSignalError(""); setSignals([]);
    try {
      const response = await fetch(`/api/signals?q=${encodeURIComponent(term)}`, { cache: "no-store" });
      const result = await response.json() as { signals?: Signal[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Search unavailable.");
      setSignals(result.signals ?? []);
    } catch (failure) { setSignalError(failure instanceof Error ? failure.message : "Search unavailable."); }
    finally { setSearching(false); }
  }

  function attachSignal(signal: Signal) {
    if (!selected) return;
    const note = `${signal.source}, ${signal.date.slice(0, 10)}: ${signal.url}`;
    const base = editingId === selected.id ? draft.evidence : selected.evidence;
    startEditing(selected);
    setDraft(d => ({ ...d, evidence: [base, note].filter(Boolean).join("\n").slice(0, 500) }));
    setSignalError("Source added to the edit form. Save the niche to keep it.");
  }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_84%_2%,#caf7e9_0%,#f6f2e5_51%,#dde9e0_100%)] px-4 pb-14 text-[#19363a] sm:px-7 lg:px-10">
    <div className="mx-auto max-w-[1450px]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c6d6ca] py-5">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#519c8a] bg-[#087f81] text-xl font-black text-[#fffdf4]">T</span>
          <div><div className="text-base font-bold tracking-wide">SMARTPICKSHOP <span className="text-[#087f81]">/ TREND LAB</span></div><div className="text-sm text-[#4b686e]">Niche opportunity workspace</div></div>
        </div>
        <span className="rounded-full border border-[#84ada1] px-3 py-1.5 text-sm text-[#236e69]">PRIVATE · {savedStatus}</span>
      </header>

      <div className="my-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.16em] text-[#237574]">Opportunity desk</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Compare niches with clear numbers.</h1></div>
        <p className="max-w-lg text-base leading-relaxed text-[#4b6d6e]">Enter your own estimates, compare scores, and keep the source of each estimate in view.</p></div>

      <div className="grid gap-5 lg:grid-cols-[minmax(330px,.82fr)_minmax(0,1.18fr)]">
        <section className="rounded-2xl border border-[#c6d6ca] bg-[#fffdf4] p-5 shadow-[0_18px_70px_#43634918] sm:p-6" aria-labelledby="entry-title">
          <div className="mb-5 flex items-center justify-between gap-2"><div><p className="text-sm uppercase tracking-[.14em] text-[#497072]">01 / Inputs</p><h2 id="entry-title" className="mt-1 text-2xl font-semibold">{editingId ? "Edit this niche" : "Add a niche"}</h2></div>
            {editingId && <Button type="button" variant="outline" onClick={startNew} className="border-[#8eb1a5] bg-transparent text-[#19363a]">New niche</Button>}</div>
          <form onSubmit={submit} className="space-y-5">
            <div><label htmlFor="niche-name" className="mb-2 block text-sm font-semibold">Niche or product idea</label><Input id="niche-name" maxLength={90} required placeholder="e.g. Bookkeeping checklist for freelancers" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} className="h-11 border-[#a3beb4] bg-[#f5f8ef] text-base placeholder:text-[#688681]" /></div>
            <div className="grid gap-4 sm:grid-cols-2">{fields.map(field => <div key={field.key}><div className="mb-2 flex items-center justify-between gap-2"><label htmlFor={field.key} className="text-sm font-semibold">{field.label}</label><span className="text-xs text-[#317a71]">{field.weight}</span></div>
              <Input id={field.key} type="number" inputMode="numeric" min={0} max={100} step={1} required value={draft[field.key]} onChange={e => setDraft(d => ({ ...d, [field.key]: e.target.value }))} className="h-11 border-[#a3beb4] bg-[#f5f8ef] text-base" /><p className="mt-1.5 text-sm leading-snug text-[#57736e]">{field.hint}</p></div>)}</div>
            <div><label htmlFor="evidence" className="mb-2 block text-sm font-semibold">Evidence notes <span className="font-normal text-[#526e6c]">(optional)</span></label><textarea id="evidence" maxLength={500} rows={3} placeholder="Buyer requests, source links, or why you picked these numbers" value={draft.evidence} onChange={e => setDraft(d => ({ ...d, evidence: e.target.value }))} className="w-full rounded-lg border border-[#a3beb4] bg-[#f5f8ef] p-3 text-base outline-none placeholder:text-[#688681] focus-visible:ring-2 focus-visible:ring-[#087f81]" /></div>
            {error && <p role="alert" className="rounded-lg border border-[#d78691] bg-[#ffebe3] p-3 text-sm text-[#8b382f]">{error}</p>}
            <Button disabled={busy} type="submit" className="h-11 w-full bg-[#087f81] text-base font-bold text-[#fffdf4] hover:bg-[#07696c]"><Plus aria-hidden="true" />{busy ? "Calculating…" : editingId ? "Update opportunity" : "Score and compare"}</Button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#c6d6ca] bg-[#fffdf4] p-5 shadow-[0_18px_70px_#43634918] sm:p-6" aria-labelledby="result-title">
          <p className="text-sm uppercase tracking-[.14em] text-[#497072]">02 / Opportunity readout</p>
          {selected ? <><div className="mt-3 flex flex-wrap items-start justify-between gap-5 border-b border-[#c6d6ca] pb-6"><div className="min-w-0 flex-1"><h2 id="result-title" className="text-2xl font-semibold">{selected.name}</h2><p className="mt-2 text-sm text-[#537375]">{selected.id.startsWith("demo-") ? "Sample estimates · edit before relying on them" : "Your saved estimates"}</p></div>
            <div className="flex min-w-32 items-baseline gap-1 text-[#087f81]"><strong className="text-6xl font-bold tabular-nums tracking-tight">{selected.score}</strong><span className="text-lg">/ 100</span></div></div>
            <div className="mt-6 grid gap-x-7 gap-y-5 sm:grid-cols-2">{[
              ["Demand", selected.demand], ["Competition advantage", selected.competitionAdvantage], ["Urgency", selected.urgency], ["Monetization", selected.monetization],
            ].map(([label, value]) => <div key={label}><div className="mb-2 text-sm font-semibold">{label}</div><ScoreBar label={String(label)} value={Number(value)} /></div>)}</div>
            <div className="mt-7 rounded-xl border border-[#bad2c6] bg-[#f3f8ee] p-4"><h3 className="mb-2 font-semibold text-[#0c7776]">What the score means</h3><p className="text-base leading-relaxed text-[#315b60]">{selected.explanation}</p>
              <p className="mt-3 text-sm text-[#506c6c]">Formula: demand × 35% + (100 − competition) × 15% + urgency × 25% + monetization × 25%. Rounded to the nearest whole number.</p></div>
            <div className="mt-5"><h3 className="text-sm font-semibold text-[#0c7776]">Evidence behind these numbers</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#36595a]">{selected.evidence || "No evidence notes yet. Add a source or buyer signal before treating this as a decision."}</p></div>
            <div className="mt-6 flex flex-wrap gap-2"><Button variant="outline" className="border-[#83aaa0] bg-transparent text-[#19363a] hover:bg-[#deeee5]" onClick={() => startEditing(selected)}>Edit inputs <ArrowUpRight aria-hidden="true" /></Button>
              <Button variant="ghost" className="text-[#ae4d43] hover:bg-[#ffebe3] hover:text-[#8b382f]" onClick={removeSelected}><Trash2 aria-hidden="true" />Remove</Button></div>
          </> : <div className="py-16 text-center"><h2 id="result-title" className="text-xl font-semibold">No niches yet</h2><p className="mt-2 text-[#4b6d6e]">Enter one on the left to see its score.</p><Button variant="outline" className="mt-4 border-[#83aaa0] bg-transparent text-[#19363a]" onClick={() => setItems(initial)}><RotateCcw /> Restore samples</Button></div>}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-[#c6d6ca] bg-[#fffdf4] p-5 sm:p-6" aria-labelledby="comparison-title"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm uppercase tracking-[.14em] text-[#497072]">03 / Side by side</p><h2 id="comparison-title" className="mt-1 text-2xl font-semibold">Opportunity comparison</h2></div><span className="text-sm text-[#537375]">{items.length} opportunities · highest score first</span></div>
        <Table className="min-w-[710px] text-base"><TableHeader><TableRow className="border-[#bbd2c4] hover:bg-transparent"><TableHead className="text-[#365e61]">Niche</TableHead><TableHead className="text-[#365e61]">Demand</TableHead><TableHead className="text-[#365e61]">Competition</TableHead><TableHead className="text-[#365e61]">Urgency</TableHead><TableHead className="text-[#365e61]">Monetization</TableHead><TableHead className="text-[#365e61]">Final</TableHead><TableHead className="text-[#365e61]">Inspect</TableHead></TableRow></TableHeader>
          <TableBody>{sorted.map(item => <TableRow key={item.id} data-state={selected?.id === item.id ? "selected" : undefined} className="border-[#c6d6ca] hover:bg-[#e8f2e8] data-[state=selected]:bg-[#e8f2e8]"><TableCell className="max-w-[280px] whitespace-normal font-semibold">{item.name}<span className="mt-0.5 block text-xs font-normal text-[#537375]">{item.id.startsWith("demo-") ? "Sample estimate" : "Entered by you"}</span></TableCell><TableCell>{item.demand}</TableCell><TableCell>{item.competition}</TableCell><TableCell>{item.urgency}</TableCell><TableCell>{item.monetization}</TableCell><TableCell className="font-bold text-[#087f81]">{item.score}</TableCell><TableCell><Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(item.id)} className="border-[#86ada1] bg-transparent text-[#19363a] hover:bg-[#deeee5]" aria-label={`Inspect ${item.name}`}>Inspect</Button></TableCell></TableRow>)}</TableBody>
        </Table><p className="mt-4 text-sm leading-relaxed text-[#52716e]">Scores are estimates, not measured market statistics. Your saved niches remain after reload; sample rows are illustrative.</p>
      </section>

      <section className="mt-5 rounded-2xl border border-[#c6d6ca] bg-[#fffdf4] p-5 sm:p-6" aria-labelledby="signals-title">
        <p className="text-sm uppercase tracking-[.14em] text-[#497072]">04 / Source desk</p>
        <h2 id="signals-title" className="mt-1 text-2xl font-semibold">Find dated discussions</h2>
        <p className="mt-2 text-sm text-[#52716e]">Search recent Hacker News comments. A matching discussion can suggest a question to investigate; it does not prove buyers, urgency, or willingness to pay. Other niches may have no useful coverage there.</p>
        <div className="mt-4 flex flex-wrap gap-2"><Input aria-label="Discussion search terms" placeholder={selected?.name || "Search a niche"} value={query} onChange={event => setQuery(event.target.value)} className="h-11 min-w-[210px] flex-1 border-[#a3beb4] bg-[#f5f8ef] text-base" />
          <Button type="button" disabled={searching} onClick={searchSignals} className="h-11 bg-[#087f81] text-[#fffdf4]"><Search aria-hidden="true" />{searching ? "Searching…" : "Search discussions"}</Button></div>
        {signalError && <p role="status" className="mt-3 text-sm text-[#52716e]">{signalError} {query.trim() && <a className="underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={`https://hn.algolia.com/?query=${encodeURIComponent(query.trim())}`}>Search the source directly ↗</a>}</p>}
        {signals.length === 0 && !searching && !signalError && <p className="mt-4 text-sm text-[#52716e]">No results loaded yet.</p>}
        <div className="mt-4 grid gap-3 md:grid-cols-2">{signals.map(signal => <article key={signal.url} className="rounded-xl border border-[#bad2c6] bg-[#f3f8ee] p-4">
          <p className="text-xs text-[#497072]">{signal.source} · {signal.date.slice(0, 10)}</p>
          <h3 className="mt-1 font-semibold">{signal.title}</h3><p className="mt-2 text-sm text-[#52716e]">{signal.excerpt || "Open the original discussion to review the context."}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm"><a href={signal.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Read original ↗</a>
            {selected && <button type="button" onClick={() => attachSignal(signal)} className="underline underline-offset-4">Add link to niche notes</button>}</div>
        </article>)}</div>
      </section>
    </div>
  </main>;
}
