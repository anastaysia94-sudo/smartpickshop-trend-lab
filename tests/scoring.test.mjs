import test from "node:test";import assert from "node:assert/strict";
function score(x){return Math.round(.35*x.demand+.15*(100-x.competition)+.25*x.urgency+.25*x.monetization)}
test("verified formula",()=>assert.equal(score({demand:55,competition:80,urgency:50,monetization:45}),46));
test("high competition lowers score",()=>assert.ok(score({demand:50,competition:90,urgency:50,monetization:50})<score({demand:50,competition:10,urgency:50,monetization:50})));
