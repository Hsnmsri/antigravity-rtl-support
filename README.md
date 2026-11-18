# Antigravity RTL & LTR Support

A comprehensive bidirectional text and layout enhancer for Google Antigravity IDE and chat. It automatically detects and formats mixed Right-to-Left (Persian, Arabic, Hebrew) and Left-to-Right (English, code) text without breaking chat bubbles, alignment, or code blocks.

---

## Features

- **Smart BiDi Detection:**
  Automatically detects RTL text and applies proper `dir="rtl"` alignment, even for sentences starting with English words, code identifiers, or CLI commands (`git`, `npm`, etc.).
- **Proper Inline Code Isolation:**
  Inline code snippets (`<code>`) and technical terms remain Left-to-Right without disrupting sentence flow or causing punctuation flipping.
- **Strict LTR Code Blocks:**
  Multi-line fenced code blocks (`<pre><code>`) and configuration files are strictly preserved in their original LTR format and syntax highlighting.
- **Integrated Text Tools Dropdown & Floating Toolbar:**
  Selecting any chat text in an active RTL chat reveals dedicated **Text Tools ▼** controls directly inside the native Quote popup pill (with an automatic floating toolbar fallback when native pills are absent):
  - **Right-to-Left (RTL):** Forces Right-to-Left direction and right alignment for the selected block.
  - **Left-to-Right (LTR):** Forces Left-to-Right direction and left alignment for the selected block.
  - **Automatic (Auto):** Removes manual overrides and returns direction control to the auto-detection algorithm.
  - **Context-Aware:** Text direction tools are automatically hidden when RTL is toggled off for that chat.
- **Subtle Manual Override Indicator:**
  Blocks whose direction has been manually adjusted are styled with a subtle tinted background and a slim accent border, clearly indicating manual mode without visual distraction.
- **Split-View & Per-Chat RTL Toggle Button:**
  A clean toggle button positioned right beside the input permissions selector (next to Turbo in the chat footer). In split view, each open chat pane displays its own independent toggle button, allowing you to toggle RTL on or off for specific conversations without affecting other concurrent chats. Preferences persist per conversation.
- **Interactive Question Cards Support:**
  Ensures interactive `ask_question` cards, multiple-choice options, and custom write-in inputs align naturally according to text direction.
- **Full SVG Vector Icons:**
  Every UI control and menu option uses crisp, dark-theme-native SVG vector icons with zero reliance on platform-specific emojis.

---

## Installation

### 1. Global Installation (Recommended)
To enable the plugin globally across all your projects and sessions:

```bash
git clone https://github.com/hsnmsri/antigravity-rtl-support.git ~/.gemini/config/plugins/antigravity-rtl-support
```

### 2. Workspace Installation (Team / Project Scope)
To share this plugin with your team within a specific project repository, clone or place it under:

```bash
.agents/plugins/antigravity-rtl-support/
```

---

## Developer & Contact

- **Author:** Hossein Mansouri
- **Website:** [hosseinmansouri.ir](https://hosseinmansouri.ir)
- **GitHub:** [@hsnmsri](https://github.com/hsnmsri)
- **Instagram:** [@humansouri](https://instagram.com/humansouri)
- **Email:** hsnmsri82@gmail.com

---

## License

This project is licensed under the MIT License.
