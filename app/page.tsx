"use client";
import {useEffect,useMemo,useState} from "react";
import {OpportunityInput,scoreOpportunity,strongestInput} from "../lib/scoring";
import {createBackup, parseBackup, validateItems, MAX_BYTES, STORAGE_KEY} from "../lib/backup";

const seed:OpportunityInput[]=[
{id:"lead-briefs",name:"Local business lead briefs",demand:72,competition:61,urgency:78,monetization:68,evidence:"Illustrative estimates. Add real buyer requests and source links before relying on them."},
{id:"remote-toolkit",name:"Remote job application toolkit",demand:66,competition:73,urgency:74,monetization:55,evidence:"Sample estimate only."},
{id:"planner",name:"Printable project planner",demand:57,competition:49,urgency:45,monetization:63,evidence:"Sample estimate only."}
];

function clamp(n:number){return Math.max(0,Math.min(100,Number.isFinite(n)?n:0))}
export default function Page(){
 const [items,setItems]=useState<OpportunityInput[]>([]);
 const [ready,setReady]=useState(false);
 const [backupNotice,setBackupNotice]=useState("");
 const [serverBusy,setServerBusy]=useState(false);
 const [draft,setDraft]=useState<OpportunityInput>({id:"",name:"",demand:50,competition:50,urgency:50,monetization:50,evidence:""});
 useEffect(()=>{
   try{
     const raw=localStorage.getItem(STORAGE_KEY);
     setItems(raw?validateItems(JSON.parse(raw)):seed);
   }catch{setItems(seed);setBackupNotice("Saved browser data was invalid; sample data restored. Import a valid backup to recover your work.")}
   setReady(true);
 },[]);
 useEffect(()=>{if(ready){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}catch{setBackupNotice("Browser storage failed; export a backup file to retain this work.")}}},[items,ready]);
 const sorted=useMemo(()=>[...items].sort((a,b)=>scoreOpportunity(b)-scoreOpportunity(a)),[items]);
 function exportBackup(){
   try{
     const json=JSON.stringify(createBackup(items),null,2);
     const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));
     const anchor=document.createElement("a");
     anchor.href=url;anchor.download="trend-lab-backup.json";anchor.click();
     setTimeout(()=>URL.revokeObjectURL(url),1000);
     setBackupNotice("Backup downloaded. Store it somewhere private; the file contains your evidence notes.");
   }catch(err){setBackupNotice(err instanceof Error?err.message:"Could not export backup.")}
 }
 async function importBackup(file:File|undefined){
   if(!file)return;
   if(file.size>MAX_BYTES){setBackupNotice("Backup exceeds the 2 MB file limit.");return;}
   try{
     const data=parseBackup(JSON.parse(await file.text()));
     setItems(data);
     setBackupNotice(`Imported ${data.length} niches and their complete evidence notes. Existing browser rows were replaced.`);
   }catch(err){setBackupNotice(err instanceof Error?err.message:"Import failed; existing data was kept.")}
 }
 async function serverWorkspace(operation:"save"|"load"){
   if(serverBusy || !ready)return;
   if(operation==="load"&&!window.confirm("Replace browser data with the saved server workspace? Export a JSON backup first to avoid losing local changes."))return;
   setServerBusy(true);
   try{
     const response=await fetch("/api/workspace",operation==="save"?{
       method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(createBackup(items))
     }:{cache:"no-store"});
     const result=await response.json();
     if(!response.ok){setBackupNotice(result.error||"Remote storage request failed; local data was kept.");return;}
     if(operation==="save"){setBackupNotice(`Saved ${result.count} niches on configured server workspace. Also keep a private JSON backup.`);return;}
     if(!result.exists){setBackupNotice("No remote workspace found. Current browser data was kept.");return;}
     const restored=parseBackup(result.document);
     setItems(restored);
     setBackupNotice(`Loaded ${restored.length} niches and evidence notes from server workspace.`);
   }catch{setBackupNotice("Server unavailable. Your browser data was not replaced.")}
   finally{setServerBusy(false);}
 }
 function save(){
   const name=draft.name.trim(); if(!name)return;
   const item={...draft,id:draft.id||crypto.randomUUID(),name,demand:clamp(+draft.demand),competition:clamp(+draft.competition),urgency:clamp(+draft.urgency),monetization:clamp(+draft.monetization)};
   setItems(v=>[...v.filter(x=>x.id!==item.id),item]);
   setDraft({id:"",name:"",demand:50,competition:50,urgency:50,monetization:50,evidence:""});
 }
 return <main>
   <p className="sub">SMARTPICKSHOP / TREND LAB / private opportunity workspace</p>
   <h1>Compare niches with clear numbers.</h1>
   <p className="sub">Formula: demand x 35% + (100 - competition) x 15% + urgency x 25% + monetization x 25%. Evidence notes stay attached to each row. Data persists in this browser.</p>
   <section className="grid">
    <div className="card">
      <h2>01 / Add or edit a niche</h2>
      <label htmlFor="niche-name">Niche or product idea</label><input id="niche-name" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
      {(["demand","competition","urgency","monetization"] as const).map(k=><div key={k}><label>{k[0].toUpperCase()+k.slice(1)}: {draft[k]}</label><input type="range" min="0" max="100" value={draft[k]} onChange={e=>setDraft({...draft,[k]:+e.target.value})}/></div>)}
      <label>Evidence notes / source links</label><textarea rows={5} value={draft.evidence} onChange={e=>setDraft({...draft,evidence:e.target.value})}/>
      <button onClick={save}>Score and save</button>
    </div>
    <div className="card">
      <h2>02 / Opportunity readout</h2>
      {sorted[0]?<><div className="score">{scoreOpportunity(sorted[0])}/100</div><h3>{sorted[0].name}</h3><p>Strongest input: <b>{strongestInput(sorted[0])}</b></p><p className="muted">{sorted[0].evidence||"No evidence notes yet."}</p></>:<p>No niches saved.</p>}
    </div>
   </section>
   <section className="card">
    <h2>03 / Back up or restore niche research</h2>
    <p className="muted">This workspace saves to this browser only. Export a private JSON backup to recover the evidence and scores in another browser. Import replaces the current saved rows. Neither action uploads data to a server.</p>
    <p className="muted">Optional hosted storage (single private workspace): requires owner-configured Supabase and server-only credentials. No automatic sync; explicit save/load avoids silently overwriting local research.</p>
    <button type="button" disabled={serverBusy||!ready} onClick={()=>void serverWorkspace("save")}>Save to server workspace</button>{" "}
    <button type="button" disabled={serverBusy||!ready} onClick={()=>void serverWorkspace("load")}>Load server workspace</button>
    <p className="muted">Without configured storage, the server reports that saving is unavailable; JSON backup remains usable.</p>
    <button type="button" onClick={exportBackup}>Export backup (.json)</button>
    <label htmlFor="backup-file">Import backup (.json)</label>
    <input id="backup-file" type="file" accept=".json,application/json" onChange={e=>{const file=e.currentTarget.files?.[0];void importBackup(file);e.currentTarget.value="";}}/>
    {backupNotice&&<p role="status" className="muted">{backupNotice}</p>}
   </section>
   <section className="card">
    <h2>04 / Side by side comparison</h2>
    <p className="muted">{items.length} saved / highest score first / browser-persistent</p>
    <div className="table-wrap">
     <table><thead><tr><th>Niche</th><th>Demand</th><th>Competition</th><th>Urgency</th><th>Monetization</th><th>Score</th><th/></tr></thead>
     <tbody>{sorted.map(x=><tr key={x.id}><td><b>{x.name}</b><br/><span className="muted">{x.evidence||"No evidence yet"}</span></td><td>{x.demand}</td><td>{x.competition}</td><td>{x.urgency}</td><td>{x.monetization}</td><td><b>{scoreOpportunity(x)}</b></td><td><button onClick={()=>setDraft(x)}>Edit</button> <button onClick={()=>setItems(v=>v.filter(i=>i.id!==x.id))}>Remove</button></td></tr>)}</tbody></table>
    </div>
    <button onClick={()=>setItems(seed)} style={{marginTop:16}}>Restore sample rows</button>
   </section>
 </main>
}
