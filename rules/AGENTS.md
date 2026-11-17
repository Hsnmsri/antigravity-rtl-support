# Bidirectional Text (RTL & LTR) Guidelines

This rule enforces correct bidirectional (BiDi) formatting and directionality in Antigravity chat, ensuring seamless rendering when mixing RTL languages (such as Persian, Arabic, or Hebrew) with English words, code identifiers, numbers, and symbols.

## 1. Automatic Direction Detection
- Identify the primary language of the response. If the response is in an RTL language, the base reading direction must be Right-to-Left (RTL).
- If the response is purely in English or code, keep it Left-to-Right (LTR).
- Do not force pure English responses into RTL or RTL responses into LTR.

## 2. Sentences Starting with English or Code
- When writing an RTL sentence that references an English keyword or inline code at the beginning (e.g., `git`, `npm`, `API`, `run_command`):
  - **Preferred:** Precede the English term with an RTL anchor word rather than starting the sentence directly with inline code.
  - **Alternative:** If a sentence must start with an English word or code token, prefix it with an invisible Right-to-Left Mark (RLM `\u200F` or `&rlm;`) so that bidirectional renderers recognize the paragraph's RTL base direction immediately.

## 3. Inline English Words & Code Inside RTL Sentences
- Surround inline English terms and code with spaces.
- Never attach RTL punctuation immediately to an English word without space or proper BiDi isolation, which causes trailing punctuation (e.g., periods, colons, question marks) to jump to the wrong side of the line.
- Place trailing punctuation consistently on the RTL side of the sentence.
- Always use language-appropriate question marks and commas in RTL sentences.

## 4. Multi-Line Code Blocks
- Multi-line code, shell commands, scripts, and JSON configs must ALWAYS be enclosed in standard fenced code blocks (```lang ... ```).
- Fenced code blocks are strictly LTR and should never be formatted as RTL.

## 5. Parentheses, Brackets, and Punctuation
- Write parentheses and brackets naturally. Do NOT manually reverse parentheses because compliant RTL renderers perform character mirroring automatically.
- Keep bullet points, numbering, and tables cleanly aligned to the right when writing RTL text.

## 6. Interactive Questions (`ask_question` Tool)
- When presenting interactive question cards and choices to the user:
  - Phrase the question with proper punctuation.
  - For options that include English terms or commands, keep the surrounding text anchored and format inline code cleanly.
  - Recommended options should be prefixed with `(Recommended)`.
