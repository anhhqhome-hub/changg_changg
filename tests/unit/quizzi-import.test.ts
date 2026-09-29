import { describe, expect, it } from "vitest";
import { parseQuizziWordText, quizziHtmlToMarkedText } from "@/lib/quizzi-import";

describe("Quizzi Word parser", () => {
  it("parses normal A-D options and preserves underlined answer markers", () => {
    const text = `
[<g>] Read and choose [</g>]
Sample passage.
(<1>) A. first B. second [[QUIZZI_CORRECT]] C. third D. fourth
[<br>]
`;
    const questions = parseQuizziWordText(text);
    expect(questions).toHaveLength(1);
    expect(questions[0].options).toEqual(["first", "second", "third", "fourth"]);
    expect(questions[0].answer).toBe("B");
  });

  it("parses options even when Word conversion collapses run/tab boundaries", () => {
    const text = `
[<g>] Read and choose [</g>]
Sample passage.
(<1>) A. bringB. get [[QUIZZI_CORRECT]]C. makeD. look
[<br>]
`;
    const questions = parseQuizziWordText(text);
    expect(questions).toHaveLength(1);
    expect(questions[0].options).toEqual(["bring", "get", "make", "look"]);
    expect(questions[0].answer).toBe("B");
  });

  it("does not confuse D.C. in a prompt with option labels", () => {
    const text = `
[<g>] Read and choose [</g>]
(<1>) Aline was born in Washington D.C. Which statement is correct? A. one B. two C. three D. four [[QUIZZI_CORRECT]]
[<br>]
`;
    const questions = parseQuizziWordText(text);
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toContain("Washington D.C.");
    expect(questions[0].options).toEqual(["one", "two", "three", "four"]);
    expect(questions[0].answer).toBe("D");
  });

  it("keeps Word underline markers when converting Mammoth HTML", () => {
    const html = `
      <p>[&lt;g&gt;] Choose the correct answer [&lt;/g&gt;]</p>
      <p>(&lt;1&gt;) A. first <mark> B. second </mark> C. third D. fourth</p>
      <p>[&lt;br&gt;]</p>
    `;
    const markedText = quizziHtmlToMarkedText(html);
    const questions = parseQuizziWordText(markedText);

    expect(questions).toHaveLength(1);
    expect(questions[0].options).toEqual(["first", "second", "third", "fourth"]);
    expect(questions[0].answer).toBe("B");
  });

  it("keeps bold Word markers as correct answers", () => {
    const html = `
      <p>[&lt;g&gt;] Choose the correct answer [&lt;/g&gt;]</p>
      <p>(&lt;1&gt;) A. first <strong>B. second</strong> C. third D. fourth</p>
      <p>[&lt;br&gt;]</p>
    `;
    const markedText = quizziHtmlToMarkedText(html);
    const questions = parseQuizziWordText(markedText);

    expect(questions[0].options).toEqual(["first", "**second**", "third", "fourth"]);
    expect(questions[0].answer).toBe("B");
  });

  it("does not mark the last option when a cloze answer row is bold as a whole", () => {
    const html = `
      <p>[&lt;g&gt;] Choose the correct answer [&lt;/g&gt;]</p>
      <p><strong>(&lt;1&gt;) <u>A.</u> months <u>B.</u> decades C. days D. weeks</strong></p>
      <p>[&lt;br&gt;]</p>
    `;
    const markedText = quizziHtmlToMarkedText(html);
    const questions = parseQuizziWordText(markedText);

    expect(questions[0].options).toEqual(["months", "decades", "days", "weeks"]);
    expect(questions[0].answer).toBe("B");
  });

  it("keeps an option marker before a following paragraph with nested formatting", () => {
    const html = `
      <p>[&lt;g&gt;] Choose the correct answer [&lt;/g&gt;]</p>
      <p><mark>Question 1.</mark> Choose one.</p>
      <p>A. first B. second C. third <mark>D.</mark> fourth</p>
      <p><mark>Question 2.</mark> A prompt with <mark><mark>underlined</mark>.</mark></p>
      <p>A. one <mark>B.</mark> two C. three D. four</p>
      <p>[&lt;br&gt;]</p>
    `;
    const markedText = quizziHtmlToMarkedText(html);
    const questions = parseQuizziWordText(markedText);

    expect(questions[0].answer).toBe("D");
    expect(questions[1].answer).toBe("B");
  });

  it("handles nested marked option letters when the punctuation is outside the inner mark", () => {
    const html = `
      <p>[&lt;g&gt;] Choose the correct answer [&lt;/g&gt;]</p>
      <p>(&lt;4&gt;) Choose one.</p>
      <p><mark>A</mark>. first <mark>B</mark>. second <mark><mark>C</mark>.</mark> third <mark>D</mark>. fourth</p>
      <p>[&lt;br&gt;]</p>
    `;
    const markedText = quizziHtmlToMarkedText(html);
    const questions = parseQuizziWordText(markedText);

    expect(questions[0].options).toEqual(["first", "second", "third", "fourth"]);
    expect(questions[0].answer).toBe("C");
  });

  it("parses A-F word bank options without merging E and F into D", () => {
    const text = `
      [<g>] Choose the suitable words. [</g>]
      Question 37. I used to shop for ______________ at this supermarket.
      A. recycle B. environment C. housewife D. carbon footprint E. [[QUIZZI_CORRECT]] groceries F. housework
      [<br>]
    `;
    const questions = parseQuizziWordText(text);

    expect(questions[0].options).toEqual(["recycle", "environment", "housewife", "carbon footprint", "groceries", "housework"]);
    expect(questions[0].answer).toBe("E");
  });

  it("applies the answer key to fill-blank questions and does not import key rows", () => {
    const text = `
      [<g>] Put the verbs in brackets in the correct form. [</g>]
      Question 29. She _______ (give) up boxing 2 months ago.
      [<br>]
      Question 30. Minh _______ (not take) this medicine before.
      [<br>]
      **KEY**
      Question 29. gave
      Question 30. hasn't taken
    `;
    const questions = parseQuizziWordText(text);

    expect(questions).toHaveLength(2);
    expect(questions[0].options).toEqual([]);
    expect(questions[0].answer).toBe("gave");
    expect(questions[1].answer).toBe("hasn't taken");
  });

  it("applies markdown and entity encoded key rows", () => {
    const text = `
      [<g>] Put the verbs in brackets in the correct form. [</g>]
      Question 29. She _______ (give) up boxing 2 months ago.
      [<br>]
      Question 30. Minh _______ (not take) this medicine before.
      [<br>]
      **KEY**
      **Question 29.&#x20;**&#x67;ave
      **Question 30.&#x20;**&#x68;asn’t taken
    `;
    const questions = parseQuizziWordText(text);

    expect(questions).toHaveLength(2);
    expect(questions[0].answer).toBe("gave");
    expect(questions[1].answer).toBe("hasn’t taken");
  });

  it("creates a prompt when the Word marker is the only text before options", () => {
    const text = `
      [<g>] Read and choose [</g>]
      Short passage with a blank.
      (<1>) [[QUIZZI_CORRECT]] A. first B. second C. third D. fourth
      [<br>]
    `;
    const questions = parseQuizziWordText(text);

    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe("Chọn đáp án đúng cho câu (1).");
    expect(questions[0].options).toEqual(["first", "second", "third", "fourth"]);
  });
});
