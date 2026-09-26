"use client";
import {useEffect,useMemo,useState} from "react";
import {OpportunityInput,scoreOpportunity,strongestInput} from "../lib/scoring";

const seed:OpportunityInput[]=[
{id:"lead-briefs",name:"Local business lead briefs",demand:72,competition:61,urgency:78,monetization:68,evidence:"Illustrative estimates. Add real buyer requests and source links before relying on them."},
{id:"remote-toolkit",name:"Remote job application toolkit",demand:66,competition:73,urgency:74,monetization:55,evidence:"Sample estimate only."},
{id:"planner",name:"Printable project planner",demand:57,competition:49,urgency:45,monetization:63,evidence:"Sample estimate only."}
];

function clamp(n:number){return Math.max(0,Math.min(100,Number.isFinite(n)?n:0))}
export default function Page(){
 const [items,setItems]=useState<OpportunityInput[]>([]);
 const [ready,setReady]=useState(false);
 const [draft,setDraft]=useState<OpportunityInput>({id:"",name:"",demand:50,competition:50,urgency:50,monetization:50,evidence:""});
 useEffect(()=>{
   try{
     const raw=localStorage.getItem("smartpickshop-trend-lab:v1");
     setItems(raw?JSON.parse(raw):seed);
   }catch{setItems(seed)}
   setReady(true);
 },[]);
 useEffect(()=>{if(ready)localStorage.setItem("smartpickshop-trend-lab:v1",JSON.stringify(items))},[items,ready]);
 const sorted=useMemo(()=>[...items].sort((a,b)=>scoreOpportunity(b)-scoreOpportunity(a)),[items]);
 function save(){
   const name=draft.name.trim(); if(!name)return;
   const item={...draft,id:draft.id||crypto.randomUUID(),name,demand:clamp(+draft.demand),competition:clamp(+draft.competition),urgency:clamp(+draft.urgency),monetization:clamp(+draft.monetization)};
   setItems(v=>[...v.filter(x=>x.id!==item.id),item]);
   setDraft({id:"",name:"",demand:50,competition:50,urgency:50,monetization:50,evidence:""});
 }
 return <main>
   <p className="sub">SMARTPICKSHOP / TREND LAB · private opportunity workspace</p>
   <h1>Compare niches with clear numbers.</h1>
   <p className="sub">Formula: demand × 35% + (100 − competition) × 15% + urgency × 25% + monetization × 25%. Evidence notes stay attached to each row. Data persists in this browser.</p>
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
    <h2>03 / Side by side comparison</h2>
    <p className="muted">{items.length} saved · highest score first · browser-persistent</p>
    <table><thead><tr><th>Niche</th><th>Demand</th><th>Competition</th><th>Urgency</th><th>Monetization</th><th>Score</th><th/></tr></thead>
    <tbody>{sorted.map(x=><tr key={x.id}><td><b>{x.name}</b><br/><span className="muted">{x.evidence||"No evidence yet"}</span></td><td>{x.demand}</td><td>{x.competition}</td><td>{x.urgency}</td><td>{x.monetization}</td><td><b>{scoreOpportunity(x)}</b></td><td><button onClick={()=>setDraft(x)}>Edit</button> <button onClick={()=>setItems(v=>v.filter(i=>i.id!==x.id))}>Remove</button></td></tr>)}</tbody></table>
    <button onClick={()=>setItems(seed)} style={{marginTop:16}}>Restore sample rows</button>
   </section>
 </main>
}
