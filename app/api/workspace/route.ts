import { createBackup, parseBackup, MAX_BYTES } from "../../../lib/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const responseHeaders = { "Cache-Control":"private, no-store", "Content-Type":"application/json" };
function fail(status:number,message:string) {
  return new Response(JSON.stringify({error:message}),{status,headers:responseHeaders});
}
function config() {
  const raw = process.env.TRENDLAB_SUPABASE_URL?.trim();
  const token = process.env.TRENDLAB_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const workspace = process.env.TRENDLAB_WORKSPACE_ID?.trim();
  if (!raw || !token || !workspace || !/^[A-Za-z0-9_-]{1,80}$/.test(workspace)) return null;
  try {
    const url=new URL(raw);
    if(url.protocol!=="https:" || !url.hostname.endsWith(".supabase.co") ||
      url.pathname!=="/" || url.username || url.password || url.search || url.hash) return null;
    return {endpoint:url.origin,token,workspace};
  } catch { return null; }
}
function authHeaders(token:string) {
  return {apikey:token,Authorization:`Bearer ${token}`,"Content-Type":"application/json"};
}
export async function GET() {
  const c=config();
  if(!c)return fail(503,"Server storage not configured; use the browser or manual JSON backup.");
  try {
    const endpoint=`${c.endpoint}/rest/v1/trend_lab_workspaces?workspace_id=eq.${encodeURIComponent(c.workspace)}&select=document,updated_at`;
    const response=await fetch(endpoint,{headers:authHeaders(c.token),cache:"no-store",signal:AbortSignal.timeout(10000)});
    if(!response.ok)return fail(502,"Remote workspace read failed.");
    const rows:unknown=await response.json();
    if(!Array.isArray(rows)||rows.length>1)return fail(502,"Invalid remote workspace response.");
    if(!rows.length)return new Response(JSON.stringify({exists:false}),{headers:responseHeaders});
    const saved=rows[0] as {document?:unknown;updated_at?:unknown};
    const items=parseBackup(saved.document);
    return new Response(JSON.stringify({exists:true,document:createBackup(items),updatedAt:typeof saved.updated_at==="string"?saved.updated_at:null}),{headers:responseHeaders});
  } catch {return fail(502,"Remote workspace unavailable or invalid.");}
}
export async function PUT(request:Request) {
  const c=config();
  if(!c)return fail(503,"Server storage not configured; use the browser or manual JSON backup.");
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return fail(415,"JSON required.");
  const origin=request.headers.get("origin");
  if(origin)try{if(new URL(origin).origin!==new URL(request.url).origin)return fail(403,"Origin denied.");}
    catch{return fail(403,"Origin denied.");}
  if(Number(request.headers.get("content-length")||0)>MAX_BYTES)return fail(413,"Document too large.");
  let content:string;
  try {content=await request.text();}catch{return fail(400,"Invalid document.");}
  if(new TextEncoder().encode(content).length>MAX_BYTES)return fail(413,"Document too large.");
  let items;
  try{items=parseBackup(JSON.parse(content));}catch{return fail(400,"Invalid backup or score.");}
  try{
    const response=await fetch(`${c.endpoint}/rest/v1/trend_lab_workspaces?on_conflict=workspace_id`,{
      method:"POST",cache:"no-store",signal:AbortSignal.timeout(10000),
      headers:{...authHeaders(c.token),Prefer:"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify([{workspace_id:c.workspace,document:createBackup(items),updated_at:new Date().toISOString()}])
    });
    if(!response.ok)return fail(502,"Remote workspace save failed.");
    return new Response(JSON.stringify({saved:true,count:items.length}),{headers:responseHeaders});
  }catch{return fail(502,"Remote workspace unavailable.");}
}
