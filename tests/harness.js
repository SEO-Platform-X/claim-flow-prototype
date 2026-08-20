const { JSDOM } = require("jsdom");
const fs = require("fs");
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { runScripts: "outside-only", pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.navigator = dom.window.navigator;
dom.window.eval(fs.readFileSync("bundle.js", "utf8"));

const STEPS = ["PROFILE","S1","S2","T1","T2","T3","AO","L1","A_VIS","A_DIR","G0","G1","G2","G3","G4","G5","W0","W1","W2","W3","A_END","P1","C1","ST","TM","M1","CF","X0","X1","SVC","KN","SV2","SV3","B0","B1","B2","B3","B4","B5","B6","R0","R1","R2","R3","R4","R5","I0","I1","I2","I3","I4","I5","I6","I7","I8","PW","D1"];
const MARKERS = {
  PROFILE: "Claim this page, free", A_VIS: "12 questions your city asks", A_DIR: "31 sources AI reads",
  G0: "check 1 of 6", G5: "check 6 of 6", W0: "check 1 of 4", W3: "check 4 of 4", A_END: "NEXT SCAN",
  ST: "Skip anything", X0: "1 of 2", B0: "your numbers · 1 of 7", B6: "your numbers · 7 of 7",
  R0: "about the provider · 1 of 6", I0: "how you run · 1 of 9", I8: "how you run · 9 of 9",
  PW: "go live on your public page", D1: "Claimed by you", P1: "Pick how much",
};
const root = () => dom.window.document.getElementById("root");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  await sleep(400);
  let fail = 0, seen = new Set();
  for (const s of STEPS) {
    dom.window.__go(s);
    await sleep(60);
    const html = root().innerHTML;
    const text = root().textContent || "";
    const blank = html.length < 800;
    const dup = seen.has(html.slice(0, 2000)) && s !== "PROFILE";
    const marker = MARKERS[s] ? text.includes(MARKERS[s]) : true;
    const undef = text.includes("undefined");
    const ok = !blank && !dup && marker && !undef;
    if (!ok) { fail++; console.log("FAIL", s, blank?"[blank]":"", dup?"[duplicate]":"", !marker?"[marker missing: "+MARKERS[s]+"]":"", undef?"[undefined in text]":""); }
    else console.log("ok  ", s.padEnd(8), "len", html.length);
    seen.add(html.slice(0, 2000));
  }
  // D1 tabs
  dom.window.__go("D1"); await sleep(80);
  for (const tab of ["Feed","Inbox","Tools","Profile"]) {
    const btns = [...root().querySelectorAll("button")].filter(b => (b.textContent||"").includes(tab));
    if (!btns.length) { fail++; console.log("FAIL D1 tab btn missing:", tab); continue; }
    btns[btns.length-1].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    await sleep(80);
    const t = root().textContent || "";
    const need = tab === "Tools" ? "Make this happen" : tab === "Inbox" ? "Reach out" : tab === "Feed" ? "Santa Monica" : "Known for";
    if (!t.includes(need)) { fail++; console.log("FAIL D1 tab", tab, "marker missing:", need); }
    else console.log("ok   D1 tab", tab);
  }
  console.log(fail === 0 ? "ALL " + (STEPS.length + 4) + " SCREENS RENDER" : fail + " FAILURES");
  process.exit(fail === 0 ? 0 : 1);
})();
