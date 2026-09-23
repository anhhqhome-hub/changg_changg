import { describe, expect, it } from "vitest";
import { canAccessRole } from "@/domain/permissions";

describe("permission rules", () => {
  it("requires approved status and exact role", () => {
    expect(canAccessRole("TEACHER", { role: "TEACHER", status: "APPROVED" })).toBe(true);
    expect(canAccessRole("TEACHER", { role: "TEACHER", status: "PENDING" })).toBe(false);
    expect(canAccessRole("ADMIN", { role: "TEACHER", status: "APPROVED" })).toBe(false);
  });
});
