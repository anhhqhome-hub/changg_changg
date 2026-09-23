import { Bot, WandSparkles } from "lucide-react";
import { generateExamWithAIAction, generateQuestionBankWithAIAction } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

const skills = ["MIXED", "LISTENING", "SPEAKING", "READING", "WRITING"];
const questionTypes = ["MIXED", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "FILL_BLANK", "SHORT_ANSWER", "ESSAY", "SPEAKING_RECORDING"];

export function AiQuestionModal({ locale }: { locale: string }) {
  const isEn = locale === "en";
  const text = isEn
    ? {
        trigger: "AI questions",
        title: "AI create questions",
        desc: "Generate reusable questions into the question bank. You can still edit or add them to exams later.",
        topic: "Topic",
        topicPlaceholder: "School life, environment, daily routines...",
        level: "Level",
        count: "Number of questions",
        create: "Generate questions"
      }
    : {
        trigger: "AI tạo câu hỏi",
        title: "AI tạo câu hỏi",
        desc: "Sinh câu hỏi dùng lại vào ngân hàng. Sau đó giáo viên vẫn kiểm tra và đưa vào đề.",
        topic: "Chủ đề",
        topicPlaceholder: "School life, environment, daily routines...",
        level: "Trình độ",
        count: "Số câu",
        create: "Tạo câu hỏi"
      };

  return (
    <Modal title={text.title} description={text.desc} triggerLabel={text.trigger} triggerIcon="bot" triggerVariant="secondary">
      <form action={generateQuestionBankWithAIAction} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <AiFields text={text} defaultCount={6} />
        <Button type="submit">
          <WandSparkles className="h-4 w-4" /> {text.create}
        </Button>
      </form>
    </Modal>
  );
}

export function AiExamModal({ locale }: { locale: string }) {
  const isEn = locale === "en";
  const text = isEn
    ? {
        trigger: "AI exam",
        title: "AI create exam draft",
        desc: "AI creates a draft exam and opens the builder. Review every question before publishing.",
        name: "Exam name",
        description: "Description",
        topic: "Topic",
        topicPlaceholder: "Unit 3 school life, A2-B1, reading and writing...",
        level: "Level",
        count: "Number of questions",
        create: "Generate draft"
      }
    : {
        trigger: "AI tạo đề",
        title: "AI tạo bản nháp đề",
        desc: "AI tạo bản nháp và mở builder. Giáo viên kiểm tra từng câu trước khi xuất bản.",
        name: "Tên đề",
        description: "Mô tả",
        topic: "Chủ đề",
        topicPlaceholder: "Unit 3 school life, A2-B1, reading and writing...",
        level: "Trình độ",
        count: "Số câu",
        create: "Tạo bản nháp"
      };

  return (
    <Modal title={text.title} description={text.desc} triggerLabel={text.trigger} triggerIcon="bot" triggerVariant="secondary">
      <form action={generateExamWithAIAction} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-1 text-sm font-bold">
          {text.name}
          <Input name="title" required placeholder={isEn ? "AI mini test" : "Mini test AI"} />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {text.description}
          <Input name="description" placeholder={isEn ? "Short note for this exam" : "Ghi chú ngắn cho đề"} />
        </label>
        <AiFields text={text} defaultCount={10} />
        <Button type="submit">
          <Bot className="h-4 w-4" /> {text.create}
        </Button>
      </form>
    </Modal>
  );
}

function AiFields({
  text,
  defaultCount
}: {
  text: { topic: string; topicPlaceholder: string; level: string; count: string };
  defaultCount: number;
}) {
  return (
    <>
      <label className="grid gap-1 text-sm font-bold">
        {text.topic}
        <Input name="topic" required placeholder={text.topicPlaceholder} />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-bold">
          {text.level}
          <Input name="level" defaultValue="A2-B1" />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Skill
          <select name="skill" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            {skills.map((skill) => <option key={skill}>{skill}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Type
          <select name="questionType" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            {questionTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-bold">
        {text.count}
        <Input name="count" type="number" min={1} max={20} defaultValue={defaultCount} />
      </label>
    </>
  );
}
