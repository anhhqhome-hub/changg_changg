# Import Word / Quizzi fix

## What changed

- Added a parser for Quizzi-style Word documents using `[<g>]`, `[<br>]`, `(<n>)`, and `Question n.` markers.
- Word underline formatting is preserved during DOCX conversion and used to detect the correct A/B/C/D choice.
- Reading passages are grouped once and their questions are imported under the same question group.
- Large imports no longer send the entire document to Groq. Deterministic parsing runs first; AI is only used for a small number of missing multiple-choice answers when needed.
- Groq JSON calls now use GPT-OSS reasoning settings compatible with JSON responses and have a request timeout.
- AI failures are non-fatal for imports. The teacher sees a useful import error instead of a generic application error.
- Added Groq variables to `.env.example`; no API key is stored in source.

## Tested against

`DE CUONG-GKI-K12- Quizzi.docx`

- 160 questions detected
- 40 groups detected
- 160/160 questions have four options
- 159 answers detected from Word underline formatting
- 1 source question has no underlined choice and can use the optional AI missing-answer fallback

## V7.1 TypeScript build fix

- Restored the typed `aiToImportedQuestion(question: AiQuestion): ImportedQuestion` mapper.
- Fixes `TS2552: Cannot find name 'aiToImportedQuestion'` in AI question-bank and AI exam generation flows.
- Restores concrete `ImportedQuestion[]` inference, eliminating the downstream `question is unknown` and implicit `any` errors reported during `next build` type checking.
