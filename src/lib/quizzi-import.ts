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
type OptionMarker = { label: string; start: number; contentStart: number };
const correctMarker = "[[QUIZZI_CORRECT]]";
const boldStartMarker = "[[QUIZZI_BOLD_START]]";
const boldEndMarker = "[[QUIZZI_BOLD_END]]";

export function parseQuizziWordText(text: string): QuizziParsedQuestion[] {
  if (!looksLikeQuizzi(text)) return [];

  // Word sometimes underlines only the option letter and keeps the dot/parenthesis
  // in a separate run. Move our marker after the punctuation so option detection
  // remains stable: `A [[correct]]. foo` -> `A. [[correct]] foo`.
  const normalizedText = text.replace(
    new RegExp(`([A-D])\\s*(?:${escapeRegExp(boldEndMarker)})?\\s*${escapeRegExp(correctMarker)}\\s*([\\.)])`, "g"),
    `$1$2 ${correctMarker}`
  );
  const { contentText, answerKey } = extractAnswerKey(normalizedText);

  const sections = contentText
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
      const answer = parsed.answer || (parsed.options.length === 0 ? answerKey.get(start.question.number) : undefined) || "";

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
        answer
      });
    }
  }

  return result;
}

function looksLikeQuizzi(text: string) {
  return /\[<g>\]|\[<br>\]|\(\[?<\d+>\]?\)|\bQuestion\s+\d+[\.:]/i.test(text);
}

function getQuestionStart(line: string): QuestionStart | null {
  const structuralLine = removeFormattingMarkers(line);
  const named = structuralLine.match(namedQuestion);
  if (named) return { number: named[1], rest: named[2].trim() };

  const numbered = structuralLine.match(numberedQuestion);
  if (!numbered) return null;

  const rest = numbered[2].trim();
  // In cloze passages a paragraph may itself begin with (<1>)______. That is passage text, not the answer row.
  if (/^_+/.test(rest)) return null;
  return { number: numbered[1], rest };
}

function stripQuestionMarker(text: string) {
  const named = text.match(new RegExp(`^\\s*(?:${escapeRegExp(boldStartMarker)})?Question\\s+([0-9]+)[\\.:]\\s*(?:${escapeRegExp(boldEndMarker)})?([\\s\\S]*)$`, "i"));
  if (named) return named[2].trim();
  const numbered = text.match(new RegExp(`^\\s*(?:${escapeRegExp(boldStartMarker)})?\\(\\[?<([0-9]+)>\\]?\\)(?:${escapeRegExp(boldEndMarker)})?([\\s\\S]*)$`, "i"));
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
  prompt = cleanQuizziMarkup(prompt);
  // Some Word files mark the blank itself as bold/underlined. After the
  // formatting marker is removed, the text before the options can be empty.
  // Treat that the same as a normal cloze question and provide a usable prompt.
  if (!prompt) {
    prompt = hasPassage
      ? `Chọn đáp án đúng cho câu (${number}).`
      : `Chọn đáp án đúng cho câu ${number}.`;
  }
  if (!prompt && cleanedOptions.length === 0) return null;

  return { prompt, options: cleanedOptions, answer };
}

function extractAnswerKey(text: string) {
  const lines = text.split(/\r?\n/);
  const keyLineIndex = lines.findIndex((line) => isAnswerKeyHeading(line));
  if (keyLineIndex < 0) return { contentText: text, answerKey: new Map<string, string>() };

  const answerKey = new Map<string, string>();
  for (const line of lines.slice(keyLineIndex + 1)) {
    const keyLine = decodeBasicHtmlEntities(line).replace(/\*\*/g, "");
    const question = getQuestionStart(keyLine);
    if (!question) continue;
    const answer = cleanQuizziMarkup(stripQuestionMarker(keyLine));
    if (answer) answerKey.set(question.number, answer);
  }

  return {
    contentText: lines.slice(0, keyLineIndex).join("\n").trim(),
    answerKey
  };
}

function isAnswerKeyHeading(line: string) {
  const clean = cleanQuizziMarkup(decodeBasicHtmlEntities(line)).replace(/\*/g, "").trim().toLocaleUpperCase();
  return clean === "KEY" || clean === "ANSWER KEY" || clean === "ĐÁP ÁN" || clean === "DAP AN";
}


function findOrderedOptionMarkers(text: string): OptionMarker[] {
  // Word often stores tabs and option labels in separate runs. Some converters
  // preserve those tabs, while others collapse the runs into `answerB. next`.
  // Instead of requiring whitespace before every label, find an ordered A→B→C→D
  // sequence. Requiring the sequence avoids false positives such as the `C.` in
  // `Washington D.C.`.
  const candidates: OptionMarker[] = [];
  const structuralText = removeFormattingMarkers(text);
  const pattern = /([A-F])\s*[\.)]\s*/g;
  for (const match of structuralText.matchAll(pattern)) {
    const label = match[1];
    const structuralStart = match.index ?? 0;
    const start = mapStructuralIndex(text, structuralStart);
    const contentStart = mapStructuralIndex(text, structuralStart + match[0].length);
    candidates.push({ label, start, contentStart });
  }

  let best: OptionMarker[] = [];
  for (let startIndex = 0; startIndex < candidates.length; startIndex += 1) {
    if (candidates[startIndex].label !== "A") continue;
    const sequence = [candidates[startIndex]];
    let expectedCode = "B".charCodeAt(0);
    for (let index = startIndex + 1; index < candidates.length && expectedCode <= "F".charCodeAt(0); index += 1) {
      const expected = String.fromCharCode(expectedCode);
      if (candidates[index].label === expected) {
        sequence.push(candidates[index]);
        expectedCode += 1;
      }
    }
    if (sequence.length > best.length) best = sequence;
    if (best.length === 6) break;
  }

  return best.length >= 2 ? best : [];
}

function removeFormattingMarkers(value: string) {
  return value.replaceAll(boldStartMarker, "").replaceAll(boldEndMarker, "");
}

function mapStructuralIndex(original: string, structuralIndex: number) {
  let originalIndex = 0;
  let visibleIndex = 0;
  while (originalIndex < original.length && visibleIndex < structuralIndex) {
    if (original.startsWith(boldStartMarker, originalIndex)) originalIndex += boldStartMarker.length;
    else if (original.startsWith(boldEndMarker, originalIndex)) originalIndex += boldEndMarker.length;
    else {
      originalIndex += 1;
      visibleIndex += 1;
    }
  }
  while (original.startsWith(boldStartMarker, originalIndex) || original.startsWith(boldEndMarker, originalIndex)) {
    originalIndex += original.startsWith(boldStartMarker, originalIndex) ? boldStartMarker.length : boldEndMarker.length;
  }
  return originalIndex;
}

export function cleanQuizziMarkup(value: string) {
  let cleaned = value
    .replace(groupTag, "")
    .replace(/\{\s*<(\d+)>\s*\}/g, "$1")
    .replace(/\(\[<(\d+)>\]\)/g, "($1)")
    .replace(/\(<(\d+)>\)/g, "($1)")
    .replaceAll(correctMarker, "")
    .replace(/~/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
  cleaned = cleaned.replace(new RegExp(`${escapeRegExp(boldStartMarker)}([\\s\\S]*?)${escapeRegExp(boldEndMarker)}`, "g"), "**$1**");
  if (cleaned.includes(boldStartMarker) || cleaned.includes(boldEndMarker)) {
    if (cleaned.includes(boldEndMarker) && !cleaned.includes(boldStartMarker)) {
      const content = cleaned.replaceAll(boldEndMarker, "").trim();
      cleaned = content ? `**${content}**` : "";
    } else {
      cleaned = cleaned.replaceAll(boldStartMarker, "").replaceAll(boldEndMarker, "");
    }
  }
  return cleaned.replace(/\*\*\s*\*\*/g, "").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const withCorrectMarkers = html
    // Underline is the reliable answer marker. Handle it before bold so a
    // bold wrapper around an entire A-D row cannot turn the last option into D.
    .replace(/<u(?:\s[^>]*)?>([\s\S]*?)<\/u>/gi, (_match, inner: string) => {
      return `${boldStartMarker}${inner}${boldEndMarker} ${correctMarker}`;
    })
    .replace(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi, (_match, inner: string) => {
      if (!containsOptionLabels(inner)) return _match;
      return `<p>${markCorrectOptionInRow(inner, containsOptionRow(inner))}</p>`;
    })
    .replace(/<mark>\s*([A-D])\s*([\.)])\s*<\/mark>/gi, (_match, label: string, punctuation: string) => {
      return `${label.toUpperCase()}${punctuation} ${correctMarker}`;
    })
    // With Mammoth's `u => mark, b => mark` map, an underlined run inside a
    // bold answer row becomes nested <mark> tags. Keep only the nested mark
    // as the answer marker and remove the formatting marks around the row.
    .replace(/<mark>((?:(?!<\/?p(?:\s[^>]*)?>)[\s\S])*?)<mark>((?:(?!<\/?p(?:\s[^>]*)?>)[\s\S])*?)<\/mark>((?:(?!<\/?p(?:\s[^>]*)?>)[\s\S])*?)<\/mark>/gi, (_match, before: string, underlined: string, after: string) => {
      return `${before}${boldStartMarker}${underlined}${boldEndMarker} ${correctMarker}${after}`;
    })
    .replace(/<(?:mark|strong|b)(?:\s[^>]*)?>([\s\S]*?)<\/(?:mark|strong|b)>/gi, (_match, inner: string) => {
      return containsOptionRow(inner) ? inner : `${boldStartMarker}${inner}${boldEndMarker} ${correctMarker}`;
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

function containsOptionRow(value: string) {
  const visible = value.replace(/<[^>]+>/g, "").replaceAll(boldStartMarker, "").replaceAll(boldEndMarker, "");
  return /A\s*[\.)][\s\S]*B\s*[\.)][\s\S]*C\s*[\.)][\s\S]*D\s*[\.)]/i.test(visible);
}

function markCorrectOptionInRow(value: string, allowSimpleCorrectLabel: boolean) {
  const nestedLabel = /<mark>\s*<mark>\s*([A-D])\s*([\.)])?\s*<\/mark>\s*([\.)])?\s*<\/mark>/i;
  const hasNestedCorrectLabel = nestedLabel.test(value);
  const marked = hasNestedCorrectLabel
    ? value.replace(new RegExp(nestedLabel.source, "gi"), (_match, label: string, innerPunctuation: string, outerPunctuation: string) => {
        return `${label.toUpperCase()}${innerPunctuation || outerPunctuation || "."} ${correctMarker}`;
      })
    : !allowSimpleCorrectLabel
      ? value
    : value.replace(/<mark>\s*([A-D])\s*([\.)])([\s\S]*?)<\/mark>/gi, (_match, label: string, punctuation: string, rest: string) => {
        return `${label.toUpperCase()}${punctuation} ${correctMarker}${rest}`;
      });
  return marked.replace(/<\/?mark>/gi, "");
}

function containsOptionLabels(value: string) {
  const visible = value.replace(/<[^>]+>/g, "").replaceAll(boldStartMarker, "").replaceAll(boldEndMarker, "");
  return /(?:^|\s)[A-D]\s*[\.)]/i.test(visible);
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
