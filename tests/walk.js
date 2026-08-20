const { JSDOM } = require("jsdom");
const fs = require("fs");
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { runScripts: "outside-only", pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.navigator = dom.window.navigator;
dom.window.eval(fs.readFileSync("bundle.js", "utf8"));
const root = () => dom.window.document.getElementById("root");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const click = (txt) => {
  const btns = [...root().querySelectorAll("button")].filter(b => (b.textContent || "").includes(txt) && !b.disabled);
  if (!btns.length) throw new Error("no clickable button: " + txt + " on step " + dom.window.__step);
  btns[btns.length - 1].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
};
const fill = (idx, v) => {
  const inp = [...root().querySelectorAll("input")][idx];
  if (!inp) throw new Error("no input " + idx + " on " + dom.window.__step);
  const set = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
  set.call(inp, v);
  inp.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
};
let fails = 0;
const at = (exp) => {
  if (dom.window.__step !== exp) { fails++; console.log("FAIL landed on", dom.window.__step, "expected", exp); }
  else console.log("ok   →", exp);
};
(async () => {
  await sleep(400);
  // ---- golden path: claim → skip audit → full intake → dashboard ----
  click("Claim this page, free"); await sleep(60); at("S1");
  fill(0, "Dr. Chen"); fill(1, "3105550182"); await sleep(60); click("Text me my link"); await sleep(60); at("S2");
  click("show what the phone sees"); await sleep(60); at("T1");
  { const links = [...root().querySelectorAll("button"),...root().querySelectorAll("a")]; const l = links.find(x => (x.onclick || true) && (x.textContent||"").length < 80); }
  // T1: tap the SMS link inside the phone frame (the element wired to go("T2"))
  { const all = [...root().querySelectorAll("button")]; const lk = all.find(b => (b.textContent||"").toLowerCase().includes("claim") || (b.textContent||"").includes("registry")) || all[all.length-1]; lk.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); }
  await sleep(60); at("T2");
  click("Skip for now"); await sleep(60); at("T3");
  click("back to where they left off"); await sleep(60); at("AO");
  click("Show me what AI says"); await sleep(60); at("L1");
  // let loader run out (stages ~6 * tick)
  for (let i = 0; i < 40 && dom.window.__step === "L1"; i++) await sleep(400);
  at("A_VIS");
  click("Show me why"); await sleep(60); at("A_DIR");
  click("Check my Google profile"); await sleep(60); at("G0");
  for (let g = 0; g < 6; g++) { await sleep(2000); click(g === 5 ? "Now your website" : "Next check"); await sleep(60); }
  at("W0");
  for (let w = 0; w < 4; w++) { await sleep(2000); click(w === 3 ? "See the full picture" : "Next check"); await sleep(60); }
  at("A_END");
  click("Set the record straight, free"); await sleep(60); at("ST");
  click("Let's do it"); await sleep(60); at("M1");
  click("Lock in"); await sleep(60); at("CF");
  click("Everything's right"); await sleep(60); at("X0");
  click("Skip this"); await sleep(60); at("X1");
  click("Skip this"); await sleep(60); at("SVC");
  click("Botox & fillers"); await sleep(60); click("Next"); await sleep(60); at("KN");
  click("Skip this"); await sleep(60); at("SV2");
  click("Skip this"); await sleep(60); at("SV3");
  click("Skip this"); await sleep(60); at("B0");
  for (let i = 0; i < 7; i++) { click("Skip this"); await sleep(50); }
  at("R0");
  for (let i = 0; i < 6; i++) { click("Skip this"); await sleep(50); }
  at("I0");
  for (let i = 0; i < 9; i++) { click("Skip this"); await sleep(50); }
  at("PW");
  fill(0, "password123"); await sleep(60); click("Save & open my dashboard"); await sleep(80); at("D1");
  // ---- purchase path ----
  // buy path: Today task → gate → This week → Start → confirm → C1
  click("Fix it"); await sleep(80);
  click("See how we fix it"); await sleep(100);
  const tl = root().textContent;
  if (!tl.includes("Sources confirming you")) { fails++; console.log("FAIL week chart missing"); } else console.log("ok   gate landed on This week + chart");
  click("Start →"); await sleep(80);
  click("Start Get found"); await sleep(80); at("C1");
  const cbtn = [...root().querySelectorAll("button")].find(b => (b.textContent||"").includes("Google"));
  if (cbtn) { cbtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); await sleep(2800); }
  at("D1");
  // tier-1 effects: inbox must STILL be locked (needs tier 2)
  click("Inbox"); await sleep(80);
  const t = root().textContent;
  if (!t.includes("🔒 Reach out")) { fails++; console.log("FAIL inbox should still be locked at tier 1"); } else console.log("ok   inbox correctly locked at tier 1");
  // upgrade path: locked tier-2 row in week → buy gate → C1 → inbox opens
  click("This week"); await sleep(80);
  click("$32/day"); await sleep(80);
  click("Start Get recommended"); await sleep(120); at("D1"); // already connected, C1 skipped
  click("Inbox"); await sleep(80);
  const tU = root().textContent;
  if (tU.includes("🔒 Reach out")) { fails++; console.log("FAIL inbox still locked after tier-2 upgrade"); } else console.log("ok   inbox unlocked at tier 2");
  click("This week"); await sleep(80);
  const t2 = root().textContent;
  if (!t2.includes("✓ done")) { fails++; console.log("FAIL week shows no done items after purchase"); } else console.log("ok   week shows done items");
  click("Today"); await sleep(80);
  if (!root().textContent.includes("Yelp hours fixed")) { fails++; console.log("FAIL today card did not flip to done"); } else console.log("ok   today card flipped to done");
  console.log(fails === 0 ? "GOLDEN PATH CLEAN" : fails + " WALK FAILURES");
})().catch(e => { console.log("WALK ERROR:", e.message, "at step", dom.window.__step); process.exit(1); });
