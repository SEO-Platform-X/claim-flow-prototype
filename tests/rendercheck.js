// GATE 3: execute the final index.html exactly as a browser would. Catches html-level breakage.
const { JSDOM } = require("jsdom");
const fs = require("fs");
let html = fs.readFileSync(process.argv[2] || "index.html", "utf8");
html = html.replace(/<script src="https:\/\/cdn.tailwindcss.com"><\/script>/, "");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://seo-platform-x.github.io/claim-flow-prototype/" });
dom.window.onerror = (m) => { console.log("PAGE JS ERROR:", m); process.exit(1); };
setTimeout(() => {
  const root = dom.window.document.getElementById("root");
  const txt = root ? root.textContent : "";
  const btns = [...dom.window.document.querySelectorAll("button")].map(b => b.textContent.trim());
  const ok = txt.includes("Glow Aesthetics") && btns.some(b => b.includes("Claim"));
  console.log(ok ? "GATE 3 PASS: final html boots, first screen renders (" + txt.length + " chars, " + btns.length + " buttons)" : "GATE 3 FAIL: root=" + txt.slice(0, 80));
  process.exit(ok ? 0 : 1);
}, 1200);
