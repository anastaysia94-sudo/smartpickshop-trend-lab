import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

// Exercise the BUILT Next.js app through its actual production proxy, not
// the dev server and not Playwright's credential-injecting context.
const host = "127.0.0.1";
const port = 31877;
const origin = `http://${host}:${port}`;
const user = "trend-lab-ci";
const pass = "not-a-production-secret-ci-only";
const token = (u, p) => "Basic " + Buffer.from(`${u}:${p}`).toString("base64");

async function request(path, authorization) {
  return fetch(origin + path, {
    headers: authorization ? { Authorization: authorization } : {},
    redirect: "manual",
    signal: AbortSignal.timeout(5000)
  });
}

async function runServer(label, environment, check) {
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", host, "-p", String(port)], {
    env: { ...process.env, TRENDLAB_E2E_BYPASS: "1", TRENDLAB_USER: "", TRENDLAB_PASSWORD: "", ...environment, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  for (const pipe of [child.stdout, child.stderr]) {
    pipe.setEncoding("utf8");
    pipe.on("data", data => { logs = (logs + data).slice(-3000); });
  }
  try {
    let ready = false;
    for (let retry = 0; retry < 100; retry++) {
      if (child.exitCode !== null) break;
      try {
        const result = await request("/api/health");
        if (result.status === 200) { ready = true; break; }
      } catch {}
      await sleep(250);
    }
    assert.ok(ready, `${label}: production Next server did not become healthy: ${logs}`);
    await check();
    console.log(`PASS: ${label}`);
  } finally {
    child.kill("SIGTERM");
    await Promise.race([new Promise(resolve => child.once("exit", resolve)), sleep(3000)]);
    if (child.exitCode === null) child.kill("SIGKILL");
    await sleep(350);
  }
}

await runServer("credentials absent -> deny protected UI, even with bypass=1", {}, async () => {
  assert.equal((await request("/")).status, 401);
  assert.equal((await request("/", token(user, pass))).status, 401);
  assert.equal((await request("/api/health")).status, 200);
});
await runServer("production Basic auth failure/success matrix", { TRENDLAB_USER: user, TRENDLAB_PASSWORD: pass }, async () => {
  assert.equal((await request("/")).status, 401);
  assert.equal((await request("/", token(user, "wrong"))).status, 401);
  assert.equal((await request("/", "Basic NOT-BASE64!!!")).status, 401);
  assert.equal((await request("/", token(user, pass))).status, 200);
  assert.equal((await request("/api/health")).status, 200);
  assert.equal((await request("/api/version")).status, 200);
  assert.equal((await request("/api/workspace", token(user, pass))).status, 503);
  const put=await fetch(origin+"/api/workspace",{
    method:"PUT",headers:{Authorization:token(user,pass),"Content-Type":"application/json"},
    body:JSON.stringify({format:"smartpickshop-trend-lab:backup",version:1,items:[]}),
    signal:AbortSignal.timeout(5000)
  });
  assert.equal(put.status, 503);
});
console.log("Production-mode auth and fail-closed storage smoke passed.");
