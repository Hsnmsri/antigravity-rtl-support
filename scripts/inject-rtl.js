/**
 * Antigravity RTL & LTR Bidirectional Chat Injector
 * Injects dynamic RTL/LTR detection, MutationObserver, BiDi styling,
 * interactive ask_question card support, independent split-chat toggles,
 * and text selection tools (both integrated into the native Quote pill and via floating toolbar).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  const portFile = path.join(os.homedir(), '.config/Antigravity/DevToolsActivePort');
  if (!fs.existsSync(portFile)) {
    process.exit(0);
  }

  let port;
  try {
    const content = fs.readFileSync(portFile, 'utf8');
    port = content.split('\n')[0].trim();
  } catch (err) {
    process.exit(0);
  }

  if (!port || isNaN(Number(port))) {
    process.exit(0);
  }

  let targets;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    targets = await res.json();
  } catch (err) {
    process.exit(0);
  }

  const pages = targets.filter(t => t.type === 'page' && t.webSocketDebuggerUrl && t.url && !t.url.startsWith('data:'));
  if (pages.length === 0) {
    process.exit(0);
  }

  const clientScript = `(() => {
    // 0. Clean up previous instances and listeners if any
    if (window.__AGY_RTL_CLEANUP__) {
      try { window.__AGY_RTL_CLEANUP__(); } catch (_) {}
    }
    const oldToolbar = document.getElementById('agy-direction-toolbar');
    if (oldToolbar) oldToolbar.remove();
    const oldMenu = document.getElementById('agy-dir-dropdown-menu');
    if (oldMenu) oldMenu.remove();
    document.querySelectorAll('.agy-chat-rtl-toggle').forEach(el => el.remove());
    document.querySelectorAll('.agy-direction-pill-btn:not(.agy-direction-wrapper *)').forEach(el => el.remove());
    document.querySelectorAll('.agy-direction-wrapper').forEach(el => el.remove());

    const RTL_CHAR_REGEX = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/;
    const RTL_ALL_CHARS = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/g;
    const LTR_ALL_CHARS = /[A-Za-z]/g;

    function detectDirection(text) {
      if (!text || !text.trim()) return null;
      const rtlMatches = text.match(RTL_ALL_CHARS);
      const rtlCount = rtlMatches ? rtlMatches.length : 0;
      if (rtlCount === 0) return 'ltr';

      const ltrMatches = text.match(LTR_ALL_CHARS);
      const ltrCount = ltrMatches ? ltrMatches.length : 0;

      // Smart RTL Detection:
      if (rtlCount >= 3 || rtlCount >= ltrCount * 0.25 || rtlCount > ltrCount) {
        return 'rtl';
      }
      return 'ltr';
    }

    // Inject or update Stylesheet
    let style = document.getElementById('antigravity-rtl-fix-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'antigravity-rtl-fix-style';
      document.head.appendChild(style);
    }

    style.textContent = \`
      /* RTL & LTR Base Rules */
      .agy-rtl-block {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }
      .agy-ltr-block {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: isolate !important;
      }

      /* Explicit high specificity for manual overrides */
      .agy-ltr-block[data-manual-dir="ltr"],
      .agy-rtl-block [data-manual-dir="ltr"],
      .agy-rtl-block .agy-ltr-block {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: isolate !important;
      }
      .agy-rtl-block[data-manual-dir="rtl"],
      .agy-ltr-block [data-manual-dir="rtl"],
      .agy-ltr-block .agy-rtl-block {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }

      /* Subtle highlight for manually overridden blocks */
      .agy-manual-dir,
      [data-manual-dir] {
        background-color: rgba(56, 189, 248, 0.08) !important;
        border-inline-start: 3px solid rgba(56, 189, 248, 0.45) !important;
        padding-inline-start: 8px !important;
        border-radius: 4px !important;
        transition: background-color 150ms ease, border-color 150ms ease !important;
      }

      /* Inline code and English spans inside Persian blocks */
      .agy-rtl-block code:not(pre code),
      .agy-rtl-block .inline-code,
      .agy-rtl-block kbd {
        direction: ltr !important;
        unicode-bidi: isolate !important;
        display: inline-block !important;
        text-align: left !important;
        padding: 0.1em 0.35em !important;
        margin: 0 0.15em !important;
        vertical-align: baseline;
      }

      /* Keep code blocks strictly LTR */
      .agy-rtl-block pre,
      .agy-rtl-block pre code {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: normal !important;
      }

      /* Fix list indentations and bullet points in RTL */
      .agy-rtl-block ul,
      .agy-rtl-block ol {
        direction: rtl !important;
        text-align: right !important;
        padding-right: 1.5rem !important;
        padding-left: 0 !important;
        margin-right: 0 !important;
      }

      /* Fix user bubble alignment and layout */
      .agy-user-bubble.agy-rtl-block,
      .agy-user-bubble-frame:has(.agy-rtl-block) {
        direction: rtl !important;
        text-align: right !important;
      }

      /* Active typing in text input */
      [contenteditable="true"].agy-rtl-block,
      textarea.agy-rtl-block {
        direction: rtl !important;
        text-align: right !important;
      }

      /* AskQuestion Component RTL styling */
      [data-testid="ask-question-header-text"].agy-rtl-block,
      [data-testid="ask-question-header-text"] .agy-rtl-block {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }
      [data-testid="ask-question-option-text"].agy-rtl-block,
      [data-testid="ask-question-option-text"] .agy-rtl-block {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }
      [data-testid="ask-question-option"].agy-rtl-block {
        direction: rtl !important;
        text-align: right !important;
      }
      [data-testid="ask-question-option"].agy-rtl-block [data-testid="ask-question-shortcut-badge"] {
        margin-left: 0.5rem !important;
        margin-right: 0 !important;
      }
      [data-testid="ask-question-writein"].agy-rtl-block {
        direction: rtl !important;
        text-align: right !important;
      }
      [data-testid="ask-question-option-hover-card"].agy-rtl-block {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }

      /* QUOTE SELECTION PILL STYLES */
      .selection-popup.selection-quote-popup,
      .selection-popup:has(.agy-direction-wrapper) {
        width: max-content !important;
        min-width: max-content !important;
        max-width: none !important;
        overflow: visible !important;
      }
      .selection-popup .agy-selection-pill {
        width: max-content !important;
        min-width: max-content !important;
        max-width: none !important;
        display: inline-flex !important;
        flex-direction: row !important;
        align-items: center !important;
        overflow: visible !important;
        position: relative !important;
      }
      .selection-popup [data-testid="selection-quote-button"] {
        flex: 0 0 auto !important;
        min-width: max-content !important;
      }
      .agy-direction-wrapper {
        position: relative !important;
        display: inline-flex !important;
        align-items: center !important;
        flex: 0 0 auto !important;
        overflow: visible !important;
      }
      .agy-direction-pill-btn {
        flex: 0 0 auto !important;
        min-width: max-content !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
      }

      /* Dropdown Menu attached to agy-direction-wrapper */
      .agy-dir-dropdown-menu {
        position: absolute !important;
        top: calc(100% + 4px) !important;
        right: 0 !important;
        min-width: 185px !important;
        background: var(--card, #18181b) !important;
        color: var(--foreground, #fafafa) !important;
        border: 1px solid var(--border, #3f3f46) !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
        padding: 4px !important;
        display: none;
        flex-direction: column !important;
        gap: 2px !important;
        z-index: 10000000 !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        user-select: none !important;
      }
      .agy-dir-opt {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        padding: 6px 10px !important;
        border-radius: 6px !important;
        border: none !important;
        background: transparent !important;
        color: inherit !important;
        font-size: 12px !important;
        cursor: pointer !important;
        text-align: left !important;
        transition: background 100ms !important;
        white-space: nowrap !important;
      }
      .agy-dir-opt:hover {
        background: var(--secondary, #27272a) !important;
      }
      .agy-dir-opt.active {
        font-weight: 600 !important;
        color: #38bdf8 !important;
      }
      .agy-dir-svg {
        flex-shrink: 0 !important;
        opacity: 0.85;
      }
      .agy-dir-opt:hover .agy-dir-svg {
        opacity: 1;
      }
      .agy-dir-opt.active .agy-dir-svg {
        stroke: #38bdf8 !important;
        opacity: 1;
      }
      .agy-dir-opt .check-mark {
        opacity: 0;
        flex-shrink: 0 !important;
        stroke: #38bdf8 !important;
        transition: opacity 100ms ease;
      }
      .agy-dir-opt.active .check-mark {
        opacity: 1;
      }

      /* Floating Direction Toolbar (fallback when no native quote pill is active) */
      #agy-direction-toolbar {
        position: fixed !important;
        z-index: 10000000 !important;
        display: none;
        align-items: center !important;
        gap: 3px !important;
        padding: 3px 6px !important;
        background: var(--card, #18181b) !important;
        color: var(--foreground, #fafafa) !important;
        border: 1px solid var(--border, #3f3f46) !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 12px !important;
        user-select: none !important;
        pointer-events: auto !important;
      }
      .agy-float-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 3px 8px !important;
        border-radius: 5px !important;
        border: none !important;
        background: transparent !important;
        color: var(--foreground, #fafafa) !important;
        font-size: 12px !important;
        cursor: pointer !important;
        transition: background 100ms, color 100ms !important;
        white-space: nowrap !important;
      }
      .agy-float-btn:hover {
        background: var(--secondary, #27272a) !important;
      }
      .agy-float-btn.active {
        background: rgba(56, 189, 248, 0.15) !important;
        color: #38bdf8 !important;
        font-weight: 600 !important;
      }
      .agy-float-divider {
        width: 1px !important;
        height: 14px !important;
        background: var(--border, #3f3f46) !important;
        margin: 0 2px !important;
      }

      /* Chat-specific Disabled State (When toggled OFF for that chat container) */
      .agy-rtl-chat-disabled .agy-rtl-block:not([data-manual-dir="rtl"]),
      [data-testid="conversation-view"].agy-rtl-chat-disabled .agy-rtl-block:not([data-manual-dir="rtl"]) {
        direction: inherit !important;
        text-align: inherit !important;
        unicode-bidi: normal !important;
      }
      .agy-rtl-chat-disabled .agy-rtl-block ul,
      .agy-rtl-chat-disabled .agy-rtl-block ol,
      [data-testid="conversation-view"].agy-rtl-chat-disabled .agy-rtl-block ul,
      [data-testid="conversation-view"].agy-rtl-chat-disabled .agy-rtl-block ol {
        direction: inherit !important;
        text-align: inherit !important;
        padding-right: 0 !important;
        padding-left: 1.5rem !important;
      }
      .agy-rtl-chat-disabled [contenteditable="true"].agy-rtl-block,
      .agy-rtl-chat-disabled textarea.agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled [contenteditable="true"].agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled textarea.agy-rtl-block {
        direction: inherit !important;
        text-align: inherit !important;
      }
      .agy-rtl-chat-disabled [data-testid="ask-question-header-text"].agy-rtl-block,
      .agy-rtl-chat-disabled [data-testid="ask-question-header-text"] .agy-rtl-block,
      .agy-rtl-chat-disabled [data-testid="ask-question-option-text"].agy-rtl-block,
      .agy-rtl-chat-disabled [data-testid="ask-question-option-text"] .agy-rtl-block,
      .agy-rtl-chat-disabled [data-testid="ask-question-option"].agy-rtl-block,
      .agy-rtl-chat-disabled [data-testid="ask-question-writein"].agy-rtl-block,
      .agy-rtl-chat-disabled [data-testid="ask-question-option-hover-card"].agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled [data-testid="ask-question-header-text"].agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled [data-testid="ask-question-header-text"] .agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled [data-testid="ask-question-option-text"].agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled [data-testid="ask-question-option-text"] .agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled [data-testid="ask-question-option"].agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled [data-testid="ask-question-writein"].agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled [data-testid="ask-question-option-hover-card"].agy-rtl-block {
        direction: inherit !important;
        text-align: inherit !important;
        unicode-bidi: normal !important;
      }
      .agy-rtl-chat-disabled .agy-user-bubble.agy-rtl-block,
      .agy-rtl-chat-disabled .agy-user-bubble-frame:has(.agy-rtl-block),
      [data-testid="conversation-view"].agy-rtl-chat-disabled .agy-user-bubble.agy-rtl-block,
      [data-testid="conversation-view"].agy-rtl-chat-disabled .agy-user-bubble-frame:has(.agy-rtl-block) {
        direction: inherit !important;
        text-align: inherit !important;
      }
      .agy-rtl-chat-disabled .agy-direction-wrapper,
      [data-testid="conversation-view"].agy-rtl-chat-disabled .agy-direction-wrapper {
        display: none !important;
      }
    \`;

    const SELECTORS = [
      'p', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      '.agy-user-bubble', '.whitespace-pre-wrap',
      '[contenteditable="true"]', 'textarea',
      '[data-testid="ask-question-header-text"]',
      '[data-testid="ask-question-option"]',
      '[data-testid="ask-question-option-text"]',
      '[data-testid="ask-question-writein"]',
      '[data-testid="ask-question-option-hover-card"]'
    ].join(', ');

    function getConversationId() {
      const m = window.location.pathname.match(new RegExp('/c/([^/?]+)'));
      if (m) {
        const urlParams = new URLSearchParams(window.location.search);
        const focused = urlParams.get('focused');
        return focused ? (m[1] + '_' + focused) : m[1];
      }
      return 'default';
    }

    function getConversationContainer(el) {
      if (!el) return null;
      const node = el.nodeType === Node.ELEMENT_NODE ? el : el.parentElement;
      if (!node) return null;
      return node.closest('[data-testid="conversation-view"]') || node.closest('[data-cascade-id]') || node.closest('.group\\\\/pane');
    }

    function getConversationIdForElement(el) {
      const container = getConversationContainer(el);
      if (container) {
        const cascadeId = container.getAttribute('data-cascade-id');
        if (cascadeId) return cascadeId;
        const allViews = Array.from(document.querySelectorAll('[data-testid="conversation-view"]'));
        if (allViews.length > 1) {
          const idx = allViews.indexOf(container);
          if (idx !== -1) {
            return getConversationId() + '_pane_' + idx;
          }
        }
      }
      return getConversationId();
    }

    window.__AGY_RTL_CHAT_STATE__ = window.__AGY_RTL_CHAT_STATE__ || {};

    function isRtlEnabledForChat(convId) {
      const cid = convId || getConversationId();
      try {
        return localStorage.getItem('agy_rtl_chat_disabled_' + cid) !== 'true';
      } catch (_) {
        return window.__AGY_RTL_CHAT_STATE__[cid] !== 'disabled';
      }
    }

    function setRtlEnabledForChat(convId, enabled) {
      const cid = convId || getConversationId();
      try {
        if (enabled) {
          localStorage.removeItem('agy_rtl_chat_disabled_' + cid);
        } else {
          localStorage.setItem('agy_rtl_chat_disabled_' + cid, 'true');
        }
      } catch (_) {
        window.__AGY_RTL_CHAT_STATE__[cid] = enabled ? 'enabled' : 'disabled';
      }
    }

    function updateAllChatToggles() {
      const convViews = document.querySelectorAll('[data-testid="conversation-view"]');
      convViews.forEach((convView, idx) => {
        let cid = convView.getAttribute('data-cascade-id');
        if (!cid && convViews.length > 1) {
          cid = getConversationId() + '_pane_' + idx;
        }
        if (!cid) cid = getConversationId();
        const enabled = isRtlEnabledForChat(cid);
        convView.classList.toggle('agy-rtl-chat-disabled', !enabled);
      });

      if (convViews.length === 0) {
        const globalEnabled = isRtlEnabledForChat(getConversationId());
        document.body.classList.toggle('agy-rtl-chat-disabled', !globalEnabled);
      }

      const buttons = document.querySelectorAll('.agy-chat-rtl-toggle');
      buttons.forEach((btn) => {
        const cid = btn.getAttribute('data-conv-id') || getConversationIdForElement(btn);
        const isEnabled = isRtlEnabledForChat(cid);

        if (isEnabled) {
          btn.title = 'RTL Support: ON (Click to disable for this chat)';
          btn.setAttribute('aria-label', 'RTL Support: ON');
          btn.style.opacity = '1';
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M4 6h16M4 12h10M4 18h14M16 9l4 3-4 3"/></svg><span style="font-size:12px;font-weight:600;color:var(--foreground,#fafafa);">RTL</span><span style="width:6px;height:6px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px #38bdf8;margin-left:1px;"></span>';
        } else {
          btn.title = 'RTL Support: OFF (Click to enable for this chat)';
          btn.setAttribute('aria-label', 'RTL Support: OFF');
          btn.style.opacity = '0.7';
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0" style="opacity:0.5;"><path d="M4 6h16M4 12h10M4 18h14M16 9l4 3-4 3"/></svg><span style="font-size:12px;font-weight:500;color:var(--muted-foreground,#a1a1aa);">RTL</span><span style="width:6px;height:6px;border-radius:50%;background:#71717a;margin-left:1px;"></span>';
        }
      });
    }

    function attachChatToggleButtons() {
      const triggers = document.querySelectorAll('[data-testid="permissions-selector-trigger"]');
      triggers.forEach((turboBtn) => {
        if (!turboBtn || !turboBtn.parentElement) return;
        const convId = getConversationIdForElement(turboBtn);

        let btn = turboBtn.parentElement.querySelector('.agy-chat-rtl-toggle');
        if (!btn) {
          btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'agy-chat-rtl-toggle flex cursor-pointer items-center h-7 gap-1.5 rounded-full px-2 text-xs font-medium text-secondary-foreground select-none outline-none hover:bg-secondary transition-colors shrink-0 whitespace-nowrap border border-border/40';
          btn.setAttribute('data-no-drag', '');
          btn.tabIndex = 0;

          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const cid = btn.getAttribute('data-conv-id') || getConversationIdForElement(btn);
            const currentEnabled = isRtlEnabledForChat(cid);
            const nextEnabled = !currentEnabled;
            setRtlEnabledForChat(cid, nextEnabled);
            updateAllChatToggles();
            if (nextEnabled) {
              processAll();
            }
          });

          turboBtn.parentElement.insertBefore(btn, turboBtn);
        }

        btn.setAttribute('data-conv-id', convId);
      });

      updateAllChatToggles();
    }

    function processElement(el) {
      if (!el || el.id === 'antigravity-rtl-fix-style' || el.closest('.agy-dir-dropdown-menu') || el.closest('.agy-direction-wrapper') || el.closest('#agy-direction-toolbar')) return;
      if (el.closest('pre') || (el.tagName === 'CODE' && el.closest('pre'))) return;

      const convId = getConversationIdForElement(el);
      const isEnabled = isRtlEnabledForChat(convId);

      // Honor manual user override if present
      const manualDir = el.getAttribute('data-manual-dir');
      if (manualDir === 'rtl') {
        el.classList.add('agy-rtl-block', 'agy-manual-dir');
        el.classList.remove('agy-ltr-block');
        el.setAttribute('dir', 'rtl');
        el.style.direction = 'rtl';
        el.style.textAlign = 'right';
        return;
      } else if (manualDir === 'ltr') {
        el.classList.add('agy-ltr-block', 'agy-manual-dir');
        el.classList.remove('agy-rtl-block');
        el.setAttribute('dir', 'ltr');
        el.style.direction = 'ltr';
        el.style.textAlign = 'left';
        return;
      }

      // If RTL is disabled for this chat, skip auto-detection
      if (!isEnabled) return;

      const isInput = el.getAttribute('contenteditable') === 'true' || el.tagName === 'TEXTAREA';
      const text = isInput ? (el.textContent || el.value || '') : (el.textContent || '');

      const dir = detectDirection(text);
      if (dir === 'rtl') {
        el.classList.add('agy-rtl-block');
        el.classList.remove('agy-ltr-block');
        el.setAttribute('dir', 'rtl');

        if (el.getAttribute('data-testid') === 'ask-question-option') {
          const optText = el.querySelector('[data-testid="ask-question-option-text"]');
          if (optText) {
            optText.classList.add('agy-rtl-block');
            optText.classList.remove('agy-ltr-block');
            optText.setAttribute('dir', 'rtl');
          }
        }
      } else if (dir === 'ltr' && !RTL_CHAR_REGEX.test(text)) {
        el.classList.add('agy-ltr-block');
        el.classList.remove('agy-rtl-block');
        el.setAttribute('dir', 'ltr');
      }
    }

    function processAll() {
      attachChatToggleButtons();
      const targets = document.querySelectorAll(SELECTORS);
      targets.forEach(processElement);
      const pills = document.querySelectorAll('.agy-selection-pill, .selection-quote-popup > div');
      pills.forEach(attachPillBtn);
    }

    window.__ANTIGRAVITY_PROCESS_RTL__ = processAll;
    processAll();

    let activeTargetBlocks = [];

    function getSelectedBlocks() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return [];

      const range = sel.getRangeAt(0);
      const common = range.commonAncestorContainer;
      const root = common.nodeType === Node.ELEMENT_NODE ? common : common.parentElement;
      if (!root) return [];

      const rootBlock = root.closest(SELECTORS);
      if (rootBlock && !rootBlock.closest('.selection-popup') && !rootBlock.closest('.agy-dir-dropdown-menu') && !rootBlock.closest('#agy-direction-toolbar')) {
        const subBlocks = Array.from(rootBlock.querySelectorAll(SELECTORS)).filter(b => sel.containsNode(b, true));
        if (subBlocks.length > 0) return subBlocks;
        return [rootBlock];
      }

      const blocks = Array.from(root.querySelectorAll(SELECTORS)).filter(b => {
        return sel.containsNode(b, true) && !b.closest('.selection-popup') && !b.closest('.agy-dir-dropdown-menu') && !b.closest('#agy-direction-toolbar');
      });
      if (blocks.length > 0) return blocks;

      const nodes = [sel.anchorNode, sel.focusNode];
      for (const node of nodes) {
        if (!node) continue;
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        const b = el ? el.closest(SELECTORS) : null;
        if (b && !b.closest('.selection-popup') && !b.closest('.agy-dir-dropdown-menu') && !b.closest('#agy-direction-toolbar')) {
          return [b];
        }
      }

      return [];
    }

    function applyDirectionChoice(choice, blocks) {
      if (!blocks) return;
      const blockList = Array.isArray(blocks) ? blocks : [blocks];
      for (const block of blockList) {
        if (!block) continue;
        if (choice === 'rtl') {
          block.setAttribute('data-manual-dir', 'rtl');
          block.setAttribute('title', 'Manual direction: Right-to-Left (RTL)');
          block.classList.add('agy-rtl-block', 'agy-manual-dir');
          block.classList.remove('agy-ltr-block');
          block.setAttribute('dir', 'rtl');
          block.style.direction = 'rtl';
          block.style.textAlign = 'right';
        } else if (choice === 'ltr') {
          block.setAttribute('data-manual-dir', 'ltr');
          block.setAttribute('title', 'Manual direction: Left-to-Right (LTR)');
          block.classList.add('agy-ltr-block', 'agy-manual-dir');
          block.classList.remove('agy-rtl-block');
          block.setAttribute('dir', 'ltr');
          block.style.direction = 'ltr';
          block.style.textAlign = 'left';
        } else if (choice === 'auto') {
          block.removeAttribute('data-manual-dir');
          block.removeAttribute('title');
          block.classList.remove('agy-manual-dir');
          block.style.direction = '';
          block.style.textAlign = '';
          processElement(block);
        }
      }
    }

    function updateMenuState(menu, blocks) {
      if (!menu || !blocks || blocks.length === 0) return;
      const manualDir = blocks[0].getAttribute('data-manual-dir');
      const optButtons = menu.querySelectorAll('.agy-dir-opt');
      optButtons.forEach(btn => {
        const optDir = btn.getAttribute('data-dir');
        if (manualDir) {
          btn.classList.toggle('active', optDir === manualDir);
        } else {
          btn.classList.toggle('active', optDir === 'auto');
        }
      });
    }

    function hideFloatingToolbar() {
      const tb = document.getElementById('agy-direction-toolbar');
      if (tb) tb.style.display = 'none';
    }

    function showFloatingToolbar(rect, blocks) {
      let tb = document.getElementById('agy-direction-toolbar');
      if (!tb) {
        tb = document.createElement('div');
        tb.id = 'agy-direction-toolbar';
        tb.innerHTML = \`
          <span style="font-weight:600;font-size:11px;color:var(--muted-foreground,#a1a1aa);padding:0 3px;">Text Tools:</span>
          <button type="button" class="agy-float-btn" data-dir="rtl" title="Right-to-Left (RTL)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6H4M20 12H10M20 18H6M8 9l-4 3 4 3"/></svg>
            <span>RTL</span>
          </button>
          <button type="button" class="agy-float-btn" data-dir="ltr" title="Left-to-Right (LTR)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h14M16 9l4 3-4 3"/></svg>
            <span>LTR</span>
          </button>
          <span class="agy-float-divider"></span>
          <button type="button" class="agy-float-btn" data-dir="auto" title="Reset to Automatic">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            <span>Auto</span>
          </button>
        \`;

        tb.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        tb.querySelectorAll('.agy-float-btn').forEach((b) => {
          b.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dir = b.getAttribute('data-dir');
            applyDirectionChoice(dir, activeTargetBlocks);
            updateFloatingToolbarState(tb, activeTargetBlocks);
          });
        });

        document.body.appendChild(tb);
      }

      updateFloatingToolbarState(tb, blocks);

      const tbWidth = 190;
      const tbHeight = 32;
      let top = rect.top - tbHeight - 6;
      if (top < 10) {
        top = rect.bottom + 6;
      }
      let left = rect.left + (rect.width / 2) - (tbWidth / 2);
      if (left < 10) left = 10;
      if (left + tbWidth > window.innerWidth - 10) left = window.innerWidth - tbWidth - 10;

      tb.style.top = top + 'px';
      tb.style.left = left + 'px';
      tb.style.display = 'flex';
    }

    function updateFloatingToolbarState(tb, blocks) {
      if (!tb || !blocks || blocks.length === 0) return;
      const manualDir = blocks[0].getAttribute('data-manual-dir');
      tb.querySelectorAll('.agy-float-btn').forEach((b) => {
        const dir = b.getAttribute('data-dir');
        if (manualDir) {
          b.classList.toggle('active', dir === manualDir);
        } else {
          b.classList.toggle('active', dir === 'auto');
        }
      });
    }

    function attachPillBtn(nativePill) {
      if (!nativePill || !nativePill.isConnected) return;

      Array.from(nativePill.children).forEach(child => {
        if (child.matches && !child.matches('[data-testid="selection-quote-button"], [data-testid="selection-btw-button"], .agy-direction-wrapper')) {
          child.remove();
        }
      });

      const wrappers = nativePill.querySelectorAll('.agy-direction-wrapper');
      if (wrappers.length > 1) {
        for (let i = 1; i < wrappers.length; i++) {
          wrappers[i].remove();
        }
      }
      if (wrappers.length === 1) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'agy-direction-wrapper relative inline-flex items-center';

      const pillBtn = document.createElement('button');
      pillBtn.type = 'button';
      pillBtn.className = 'agy-direction-pill-btn flex items-center gap-1.5 justify-center px-2 py-1 transition-colors cursor-pointer hover:bg-secondary text-sm border-l border-border shrink-0';
      pillBtn.title = 'Text Tools';
      pillBtn.innerHTML = '<span>Text Tools</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6;"><polyline points="6 9 12 15 18 9"/></svg>';

      const menu = document.createElement('div');
      menu.className = 'agy-dir-dropdown-menu';
      menu.innerHTML = \`
        <button type="button" class="agy-dir-opt" data-dir="rtl">
          <span style="display:flex; align-items:center; gap:8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="agy-dir-svg">
              <path d="M20 6H4"/>
              <path d="M20 12H10"/>
              <path d="M20 18H6"/>
              <path d="M8 9l-4 3 4 3"/>
            </svg>
            <span>Right-to-Left (RTL)</span>
          </span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-mark">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
        <button type="button" class="agy-dir-opt" data-dir="ltr">
          <span style="display:flex; align-items:center; gap:8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="agy-dir-svg">
              <path d="M4 6h16"/>
              <path d="M4 12h10"/>
              <path d="M4 18h14"/>
              <path d="M16 9l4 3-4 3"/>
            </svg>
            <span>Left-to-Right (LTR)</span>
          </span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-mark">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
        <button type="button" class="agy-dir-opt" data-dir="auto">
          <span style="display:flex; align-items:center; gap:8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="agy-dir-svg">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>
            <span>Automatic (Auto)</span>
          </span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-mark">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      \`;

      wrapper.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      pillBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = menu.style.display === 'flex';
        if (isOpen) {
          menu.style.display = 'none';
        } else {
          document.querySelectorAll('.agy-dir-dropdown-menu').forEach(m => m.style.display = 'none');
          
          const blocks = getSelectedBlocks();
          if (blocks.length > 0) activeTargetBlocks = blocks;
          updateMenuState(menu, activeTargetBlocks);

          const pillRect = nativePill.getBoundingClientRect();
          if (pillRect.bottom + 140 > window.innerHeight) {
            menu.style.top = 'auto';
            menu.style.bottom = 'calc(100% + 4px)';
          } else {
            menu.style.top = 'calc(100% + 4px)';
            menu.style.bottom = 'auto';
          }
          menu.style.display = 'flex';
        }
      });

      const optButtons = menu.querySelectorAll('.agy-dir-opt');
      optButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const dirChoice = btn.getAttribute('data-dir');
          const blocks = getSelectedBlocks();
          if (blocks.length > 0) activeTargetBlocks = blocks;
          applyDirectionChoice(dirChoice, activeTargetBlocks);
          menu.style.display = 'none';
        });
      });

      wrapper.appendChild(pillBtn);
      wrapper.appendChild(menu);
      nativePill.appendChild(wrapper);
    }

    function handleSelectionUI() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        hideFloatingToolbar();
        document.querySelectorAll('.agy-dir-dropdown-menu').forEach(m => m.style.display = 'none');
        return;
      }

      const anchor = sel.anchorNode;
      const convId = getConversationIdForElement(anchor);
      const isEnabled = isRtlEnabledForChat(convId);

      // If RTL is disabled for this chat, NEVER show direction tools
      if (!isEnabled) {
        hideFloatingToolbar();
        document.querySelectorAll('.agy-dir-dropdown-menu').forEach(m => m.style.display = 'none');
        document.querySelectorAll('.agy-direction-wrapper').forEach(w => w.style.display = 'none');
        return;
      }

      const blocks = getSelectedBlocks();
      if (blocks.length > 0) {
        activeTargetBlocks = blocks;
      }

      const nativePill = document.querySelector('.agy-selection-pill, .selection-quote-popup > div');
      if (nativePill && nativePill.isConnected) {
        attachPillBtn(nativePill);
        const wrapper = nativePill.querySelector('.agy-direction-wrapper');
        if (wrapper) wrapper.style.display = 'inline-flex';
        hideFloatingToolbar();
      } else {
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            showFloatingToolbar(rect, activeTargetBlocks);
          }
        }
      }
    }

    const onPointerDown = (e) => {
      if (!e.target.closest || (!e.target.closest('.agy-direction-wrapper') && !e.target.closest('#agy-direction-toolbar'))) {
        document.querySelectorAll('.agy-dir-dropdown-menu').forEach(m => m.style.display = 'none');
        hideFloatingToolbar();
      }
    };

    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        hideFloatingToolbar();
      } else {
        const blocks = getSelectedBlocks();
        if (blocks.length > 0) activeTargetBlocks = blocks;
      }
    };

    const onMouseUp = () => {
      setTimeout(handleSelectionUI, 40);
    };

    const onKeyUp = (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.agy-dir-dropdown-menu').forEach(m => m.style.display = 'none');
        hideFloatingToolbar();
      } else if (e.shiftKey) {
        setTimeout(handleSelectionUI, 40);
      }
    };

    const onInput = (e) => {
      const target = e.target;
      if (target && (target.getAttribute('contenteditable') === 'true' || target.tagName === 'TEXTAREA' || target.getAttribute('data-testid') === 'ask-question-writein')) {
        processElement(target);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('input', onInput, true);
    window.addEventListener('popstate', attachChatToggleButtons);

    let observerTimeout = null;
    let pendingMutations = [];
    const observer = new MutationObserver((mutations) => {
      pendingMutations.push(...mutations);
      if (observerTimeout) return;
      observerTimeout = setTimeout(() => {
        observerTimeout = null;
        const currentMutations = pendingMutations;
        pendingMutations = [];

        attachChatToggleButtons();

        for (const m of currentMutations) {
          if (m.type === 'childList') {
            for (const node of m.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.id === 'agy-direction-toolbar' || node.classList?.contains('agy-chat-rtl-toggle') || node.classList?.contains('agy-dir-dropdown-menu') || node.classList?.contains('agy-direction-wrapper')) continue;
                if (node.matches && (node.matches('.agy-selection-pill') || node.matches('.selection-quote-popup > div'))) {
                  attachPillBtn(node);
                }
                if (node.matches && node.matches(SELECTORS)) {
                  processElement(node);
                }
                const subElements = node.querySelectorAll ? node.querySelectorAll(SELECTORS) : [];
                subElements.forEach(processElement);
                const subPills = node.querySelectorAll ? node.querySelectorAll('.agy-selection-pill, .selection-quote-popup > div') : [];
                subPills.forEach(attachPillBtn);
              }
            }
          } else if (m.type === 'characterData' && m.target.parentElement) {
            processElement(m.target.parentElement);
          }
        }
      }, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.__AGY_RTL_CLEANUP__ = () => {
      try { observer.disconnect(); } catch (_) {}
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('input', onInput, true);
      window.removeEventListener('popstate', attachChatToggleButtons);
      document.querySelectorAll('.agy-chat-rtl-toggle').forEach(el => el.remove());
      const tb = document.getElementById('agy-direction-toolbar');
      if (tb) tb.remove();
      document.querySelectorAll('[data-testid="conversation-view"]').forEach(v => v.classList.remove('agy-rtl-chat-disabled'));
      document.body.classList.remove('agy-rtl-chat-disabled');
    };

    window.__ANTIGRAVITY_RTL_INJECTED__ = true;
    return { status: 'ok_split_per_chat_and_selection_tools' };
  })()`;

  for (const page of pages) {
    try {
      await new Promise((resolve) => {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        const timeout = setTimeout(() => {
          try { ws.close(); } catch (_) {}
          resolve();
        }, 2000);

        ws.onopen = () => {
          ws.send(JSON.stringify({
            id: 1,
            method: 'Runtime.evaluate',
            params: {
              expression: clientScript,
              returnByValue: true
            }
          }));
        };

        ws.onmessage = () => {
          clearTimeout(timeout);
          try { ws.close(); } catch (_) {}
          resolve();
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          try { ws.close(); } catch (_) {}
          resolve();
        };
      });
    } catch (_) {}
  }
}

main().catch(() => {}).then(() => process.exit(0));
