import { describe, expect, it } from "vitest";
import { parseQuizziWordText } from "@/lib/quizzi-import";

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
});
