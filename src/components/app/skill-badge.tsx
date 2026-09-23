import { Badge } from "@/components/ui/badge";

const tones = {
  LISTENING: "blue",
  SPEAKING: "yellow",
  READING: "green",
  WRITING: "indigo"
} as const;

export function SkillBadge({ skill }: { skill: keyof typeof tones | string }) {
  return <Badge tone={tones[skill as keyof typeof tones] ?? "slate"}>{skill}</Badge>;
}
