# Bidirectional Text (RTL & LTR) Guidelines

This rule enforces correct bidirectional (BiDi) formatting and directionality in Antigravity chat, ensuring seamless rendering when mixing Persian (or Arabic/Hebrew) with English words, code identifiers, numbers, and symbols.

## 1. Automatic Direction Detection
- Identify the primary language of the response. If the response is in Persian (or RTL), the base reading direction must be Right-to-Left (RTL).
- If the response is purely in English or code, keep it Left-to-Right (LTR).
- Do not force pure English responses into RTL or Persian responses into LTR.

## 2. Sentences Starting with English or Code
- When writing a Persian sentence that references an English keyword or inline code at the beginning (e.g., `git`, `npm`, `API`, `run_command`):
  - **Preferred:** Precede the English term with a Persian anchor word:
    - *Better:* `دستور \`npm install\` را اجرا کنید.` (instead of `\`npm install\` را اجرا کنید.`)
    - *Better:* `پکیج \`axios\` برای ارسال درخواست استفاده می‌شود.` (instead of `\`axios\` یک پکیج است...`)
  - **Alternative:** If a sentence must start with an English word or code token, prefix it with an invisible Right-to-Left Mark (RLM `\u200F` or `&rlm;`) so that bidirectional renderers recognize the paragraph's RTL base direction immediately.

## 3. Inline English Words & Code Inside Persian Sentences
- Surround inline English terms and code with spaces: `در فایل \`config.json\` تنظیمات قرار دارد.`
- Never attach Persian punctuation immediately to an English word without space or proper BiDi isolation, which causes trailing punctuation (e.g., `.`, `!`, `:`) to jump to the wrong side of the line.
- Place trailing punctuation (e.g., نقطه پایانی، دونقطه، علامت سوال) consistently on the Persian side of the sentence.
- Always use Persian question mark (`؟`) and Persian comma (`،`) in Persian sentences.

## 4. Multi-Line Code Blocks
- Multi-line code, shell commands, scripts, and JSON configs must ALWAYS be enclosed in standard fenced code blocks (```lang ... ```).
- Fenced code blocks are strictly LTR and should never be formatted as RTL.

## 5. Parentheses, Brackets, and Punctuation
- Write parentheses and brackets naturally: `(مانند این گزینه)`. Do NOT manually reverse parentheses `)مثل این(` because compliant RTL renderers perform character mirroring automatically.
- Keep bullet points, numbering, and tables cleanly aligned to the right when writing Persian text.

## 6. Interactive Questions (`ask_question` Tool)
- When presenting interactive question cards and choices to the user in Persian:
  - Phrase the question in Persian with proper punctuation.
  - For options that include English terms or commands (e.g. `(پیشنهادی) تنظیم پکیج \`zod\``), keep the surrounding Persian text anchored and format inline code cleanly.
  - Recommended options should be prefixed with `(پیشنهادی)` or `(Recommended)`.

