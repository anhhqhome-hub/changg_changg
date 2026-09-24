"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { buildAdminDataPayload, getAdminEntityDelegate } from "@/lib/admin-data";

function safeError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 180);
  return "UNKNOWN_ERROR";
}

function adminDataUrl(locale: string, entity: string, state: "created" | "updated" | "deleted" | "error", message?: string) {
  const query = new URLSearchParams({ entity, state });
  if (message) query.set("message", message);
  return `/${locale}/admin/data?${query.toString()}`;
}

async function audit(actorUserId: string, action: string, model: string, entityId: string, metadata?: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      entityType: model,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });
}

export async function createAdminDataRecordAction(formData: FormData) {
  const locale = z.string().default("vi").parse(formData.get("locale") || "vi");
  const entityKey = z.string().min(1).parse(formData.get("entity"));
  const admin = await requireRole("ADMIN", locale);
  let target = adminDataUrl(locale, entityKey, "created");
  try {
    const { entity, delegate } = getAdminEntityDelegate(entityKey);
    const data = buildAdminDataPayload(entity, formData, "create");
    const created = await delegate.create({ data });
    const id = String(created.id ?? "unknown");
    await audit(admin.id, "ADMIN_DATA_CREATED", entity.model, id, { fields: Object.keys(data) });
    revalidatePath(`/${locale}/admin/data`);
  } catch (error) {
    target = adminDataUrl(locale, entityKey, "error", safeError(error));
  }
  redirect(target);
}

export async function updateAdminDataRecordAction(formData: FormData) {
  const locale = z.string().default("vi").parse(formData.get("locale") || "vi");
  const entityKey = z.string().min(1).parse(formData.get("entity"));
  const recordId = z.string().min(1).parse(formData.get("recordId"));
  const admin = await requireRole("ADMIN", locale);
  let target = adminDataUrl(locale, entityKey, "updated");
  try {
    const { entity, delegate } = getAdminEntityDelegate(entityKey);
    const data = buildAdminDataPayload(entity, formData, "update");
    await delegate.update({ where: { id: recordId }, data });
    await audit(admin.id, "ADMIN_DATA_UPDATED", entity.model, recordId, { fields: Object.keys(data) });
    revalidatePath(`/${locale}/admin/data`);
  } catch (error) {
    target = adminDataUrl(locale, entityKey, "error", safeError(error));
  }
  redirect(target);
}

export async function deleteAdminDataRecordAction(formData: FormData) {
  const locale = z.string().default("vi").parse(formData.get("locale") || "vi");
  const entityKey = z.string().min(1).parse(formData.get("entity"));
  const recordId = z.string().min(1).parse(formData.get("recordId"));
  const admin = await requireRole("ADMIN", locale);
  let target = adminDataUrl(locale, entityKey, "deleted");
  try {
    const { entity, delegate } = getAdminEntityDelegate(entityKey);
    await delegate.delete({ where: { id: recordId } });
    await audit(admin.id, "ADMIN_DATA_DELETED", entity.model, recordId);
    revalidatePath(`/${locale}/admin/data`);
  } catch (error) {
    target = adminDataUrl(locale, entityKey, "error", safeError(error));
  }
  redirect(target);
}
