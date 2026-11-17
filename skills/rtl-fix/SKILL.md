---
name: rtl-fix
description: Fixes RTL (Persian/Arabic) and LTR mixed text display, directionality, and alignment in Antigravity chat. Use when the user reports text disorder with Persian and English words, or when re-applying the bidirectional layout fix.
---

# RTL & LTR Chat Bidirectional Fixer

This skill manages and verifies bidirectional (RTL/LTR) text rendering in Antigravity chat.

## Overview
When mixing Persian and English text in chat (such as terminal commands, code snippets, or English technical terms embedded in Persian sentences), standard LTR interfaces may scramble the text order, displace punctuation to the far left, or break paragraph alignment.

This plugin solves the issue through two synchronized mechanisms:
1. **Dynamic UI BiDi Injector (`scripts/inject-rtl.js`)**:
   - Injects intelligent RTL/LTR detection and CSS rules directly into the Antigravity chat DOM via the local DevTools bridge.
   - Provides an interactive floating Direction toolbar / dropdown when text is selected in the chat (RTL / LTR / Auto).
   - Monitors live chat messages with a `MutationObserver` so every incoming assistant response and user bubble is instantly evaluated.
   - Dynamically updates `dir="rtl"` or `dir="ltr"` on the user input box as the user types.
   - Ensures inline code blocks (`<code>`) remain LTR without breaking the surrounding RTL Persian sentence structure.
   - Keeps code blocks (`<pre>`) strictly LTR.
2. **Agent Formatting Rules (`rules/AGENTS.md`)**:
   - Ensures the model formats Persian text with proper anchors and spacing around inline code and English terms.

## Re-applying or Verifying the Fix

To re-apply the injector to all open Antigravity windows:
```bash
node ~/.gemini/config/plugins/antigravity-rtl-support/scripts/inject-rtl.js
```

## Verifying Status
Verify that the injection is active in the current window:
```bash
node -e '
async function check() {
  const fs = require("fs"), path = require("path"), os = require("os");
  const pFile = path.join(os.homedir(), ".config/Antigravity/DevToolsActivePort");
  if (!fs.existsSync(pFile)) return console.log("DevTools port file not found.");
  const port = fs.readFileSync(pFile, "utf8").split("\n")[0].trim();
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await res.json();
  const target = targets.find(t => t.type === "page" && t.title.includes("Antigravity"));
  if (!target) return console.log("Antigravity window target not found.");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: "Boolean(window.__ANTIGRAVITY_RTL_INJECTED__)", returnByValue: true } }));
  ws.onmessage = (e) => { console.log("RTL Active:", JSON.parse(e.data).result?.result?.value); ws.close(); process.exit(0); };
}
check();
'
```
