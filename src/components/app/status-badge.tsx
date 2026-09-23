import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "APPROVED" || status === "GRADED" || status === "PUBLISHED" ? "green" : status.includes("PENDING") || status === "GRADING" ? "yellow" : status === "REJECTED" || status === "SUSPENDED" ? "red" : "slate";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
