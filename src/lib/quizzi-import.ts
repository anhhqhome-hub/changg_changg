export type QuizziParsedQuestion = {
  groupKey: string;
  groupTitle: string;
  groupInstructions?: string;
  passageTitle?: string;
  passageBody?: string;
  sourceNumber: string;
  title: string;
  prompt: string;
  options: string[];
  answer?: string;
};

type QuestionStart = {
  number: string;
  rest: string;
};

const breakMarker = /\s*\[<br>\]\s*/i;
const groupTag = /\[<\/?g>\]/gi;
const numberedQuestion = /^\s*\(\[?<([0-9]+)>\]?\)([\s\S]*)$/i;
const namedQuestion = /^\s*Question\s+([0-9]+)[\.:]\s*([\s\S]*)$/i;
type OptionMarker = { label: "A" | "B" | "C" | "D"; start: number; contentStart: number };
const correctMarker = "[[QUIZZI_CORRECT]]";

export function parseQuizziWordText(text: string): QuizziParsedQuestion[] {
  if (!looksLikeQuizzi(text)) return [];

  // Word sometimes underlines only the option letter and keeps the dot/parenthesis
  // in a separate run. Move our marker after the punctuation so option detection
  // remains stable: `A [[correct]]. foo` -> `A. [[correct]] foo`.
  const normalizedText = text.replace(
    /([A-D])\s*\[\[QUIZZI_CORRECT\]\]\s*([\.)])/g,
    `$1$2 ${correctMarker}`
  );

  const sections = normalizedText
    .split(breakMarker)
    .map((section) => section.trim())
    .filter(Boolean);

  const result: QuizziParsedQuestion[] = [];

  for (const [sectionIndex, section] of sections.entries()) {
    const lines = section
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const starts = lines
      .map((line, index) => ({ index, question: getQuestionStart(line) }))
      .filter((entry): entry is { index: number; question: QuestionStart } => Boolean(entry.question));

    if (starts.length === 0) continue;

    const preamble = lines.slice(0, starts[0].index);
    const instructions = cleanQuizziMarkup(
      preamble.filter((line) => line.includes("[<g>]", 0) || line.includes("[</g>]", 0)).join(" ")
    );

    let passageLines = preamble.filter((line) => !line.includes("[<g>]", 0) && !line.includes("[</g>]", 0));
    if (sectionIndex === 0 && passageLines[0] && looksLikeDocumentHeading(passageLines[0])) {
      passageLines = passageLines.slice(1);
    }

    let passageTitle: string | undefined;
    if (passageLines.length > 1 && looksLikePassageTitle(passageLines[0])) {
      passageTitle = cleanQuizziMarkup(passageLines[0]);
      passageLines = passageLines.slice(1);
    }
    const passageBody = cleanQuizziMarkup(passageLines.join("\n")) || undefined;
    const groupKey = `quizzi-${sectionIndex + 1}`;
    const groupTitle = passageTitle || `Phần ${sectionIndex + 1}`;

    for (const [questionIndex, start] of starts.entries()) {
      const end = starts[questionIndex + 1]?.index ?? lines.length;
      const block = lines.slice(start.index, end);
      const parsed = parseQuestionBlock(block, start.question.number, Boolean(passageBody));
      if (!parsed) continue;

      result.push({
        groupKey,
        groupTitle,
        groupInstructions: instructions || undefined,
        passageTitle: passageTitle || (passageBody ? groupTitle : undefined),
        passageBody,
        sourceNumber: start.question.number,
        title: `Câu ${start.question.number}`,
        prompt: parsed.prompt,
        options: parsed.options,
        answer: parsed.answer
      });
    }
  }

  return result;
}

function looksLikeQuizzi(text: string) {
  return /\[<g>\]|\[<br>\]|\(\[?<\d+>\]?\)|\bQuestion\s+\d+[\.:]/i.test(text);
}

function getQuestionStart(line: string): QuestionStart | null {
  const named = line.match(namedQuestion);
  if (named) return { number: named[1], rest: named[2].trim() };

  const numbered = line.match(numberedQuestion);
  if (!numbered) return null;

  const rest = numbered[2].trim();
  // In cloze passages a paragraph may itself begin with (<1>)______. That is passage text, not the answer row.
  if (/^_+/.test(rest)) return null;
  return { number: numbered[1], rest };
}

function stripQuestionMarker(text: string) {
  const named = text.match(namedQuestion);
  if (named) return named[2].trim();
  const numbered = text.match(numberedQuestion);
  if (numbered) return numbered[2].trim();
  return text.trim();
}

function parseQuestionBlock(block: string[], number: string, hasPassage: boolean) {
  const text = stripQuestionMarker(block.join("\n"));
  const matches = findOrderedOptionMarkers(text);
  const options: string[] = [];

  let prompt = text;
  if (matches.length > 0) {
    prompt = text.slice(0, matches[0].start).trim();
    for (const [index, match] of matches.entries()) {
      const optionStart = match.contentStart;
      const next = matches[index + 1];
      const optionEnd = next ? next.start : text.length;
      options.push(text.slice(optionStart, optionEnd));
    }
  }

  let answer = "";
  const cleanedOptions = options.map((option, index) => {
    if (option.includes(correctMarker)) answer = String.fromCharCode(65 + index);
    return cleanQuizziMarkup(option).trim();
  }).filter(Boolean);
  if (!prompt) {
    prompt = hasPassage
      ? `Chọn đáp án đúng cho câu (${number}).`
      : `Chọn đáp án đúng cho câu ${number}.`;
  }
  prompt = cleanQuizziMarkup(prompt);
  if (!prompt && cleanedOptions.length === 0) return null;

  return { prompt, options: cleanedOptions, answer };
}


function findOrderedOptionMarkers(text: string): OptionMarker[] {
  // Word often stores tabs and option labels in separate runs. Some converters
  // preserve those tabs, while others collapse the runs into `answerB. next`.
  // Instead of requiring whitespace before every label, find an ordered A→B→C→D
  // sequence. Requiring the sequence avoids false positives such as the `C.` in
  // `Washington D.C.`.
  const candidates: OptionMarker[] = [];
  const pattern = /([A-D])\s*[\.)]\s*/g;
  for (const match of text.matchAll(pattern)) {
    const label = match[1] as OptionMarker["label"];
    const start = match.index ?? 0;
    candidates.push({ label, start, contentStart: start + match[0].length });
  }

  let best: OptionMarker[] = [];
  for (let startIndex = 0; startIndex < candidates.length; startIndex += 1) {
    if (candidates[startIndex].label !== "A") continue;
    const sequence = [candidates[startIndex]];
    let expectedCode = "B".charCodeAt(0);
    for (let index = startIndex + 1; index < candidates.length && expectedCode <= "D".charCodeAt(0); index += 1) {
      const expected = String.fromCharCode(expectedCode);
      if (candidates[index].label === expected) {
        sequence.push(candidates[index]);
        expectedCode += 1;
      }
    }
    if (sequence.length > best.length) best = sequence;
    if (best.length === 4) break;
  }

  return best.length >= 2 ? best : [];
}

export function cleanQuizziMarkup(value: string) {
  return value
    .replace(groupTag, "")
    .replace(/\{\s*<(\d+)>\s*\}/g, "$1")
    .replace(/\(\[<(\d+)>\]\)/g, "($1)")
    .replace(/\(<(\d+)>\)/g, "($1)")
    .replaceAll(correctMarker, "")
    .replace(/~/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function looksLikeDocumentHeading(line: string) {
  const clean = cleanQuizziMarkup(line).toLocaleUpperCase();
  return clean.length < 160 && (clean.startsWith("ĐỀ ") || clean.includes("ĐỀ GIỮA KỲ") || clean.includes("ĐỀ GIỮA KÌ"));
}

function looksLikePassageTitle(line: string) {
  const clean = cleanQuizziMarkup(line);
  if (!clean || clean.length > 120) return false;
  if (/\(\d+\)|_+/.test(clean)) return false;
  if (/^\(Adapted from/i.test(clean)) return false;
  return !/[.!?]$/.test(clean) || /^[A-Z0-9 :'’\-–—]+$/.test(clean);
}


/**
 * Converts Mammoth HTML into text understood by the Quizzi parser while retaining
 * Word underline formatting as a correct-answer marker. Mammoth is configured by
 * the caller with the style map `u => mark`.
 */
export function quizziHtmlToMarkedText(html: string) {
  const withCorrectMarkers = html.replace(/<mark(?:\s[^>]*)?>([\s\S]*?)<\/mark>/gi, (_match, inner: string) => {
    return `${inner} ${correctMarker}`;
  });

  return decodeBasicHtmlEntities(
    withCorrectMarkers
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<\/?(?:p|div|li|h[1-6]|tr|td|th)(?:\s[^>]*)?>/gi, " ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeBasicHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}
