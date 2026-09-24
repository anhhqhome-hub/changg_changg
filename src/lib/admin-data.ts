import "server-only";
import { prisma } from "@/lib/db";
import { getAdminDataEntity, type AdminDataEntity, type AdminDataField } from "@/lib/admin-data-catalog";

type GenericDelegate = {
  count: (args?: unknown) => Promise<number>;
  findMany: (args?: unknown) => Promise<Record<string, unknown>[]>;
  create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  delete: (args: { where: { id: string } }) => Promise<Record<string, unknown>>;
};

export type AdminRelationOption = { id: string; label: string };

function delegateNameForModel(model: string) {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function getDelegateByName(delegateName: string): GenericDelegate {
  const client = prisma as unknown as Record<string, unknown>;
  const delegate = client[delegateName] as GenericDelegate | undefined;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(`Unsupported Prisma delegate: ${delegateName}`);
  }
  return delegate;
}

export function getAdminEntityDelegate(entityKey: string) {
  const entity = getAdminDataEntity(entityKey);
  if (!entity) throw new Error("UNKNOWN_ADMIN_ENTITY");
  return { entity, delegate: getDelegateByName(entity.delegate) };
}

export function normalizeAdminFieldValue(field: AdminDataField, raw: FormDataEntryValue | null, mode: "create" | "update") {
  if (field.readOnly) return { include: false as const, value: undefined };
  if (raw === null) return { include: false as const, value: undefined };
  const text = String(raw).trim();
  if (!text) {
    if (!field.required) return { include: true as const, value: null };
    if (mode === "create" && field.hasDefault) return { include: false as const, value: undefined };
    return { include: false as const, value: undefined };
  }
  if (field.type === "Boolean") return { include: true as const, value: text === "true" };
  if (field.type === "Int") {
    const value = Number.parseInt(text, 10);
    if (!Number.isFinite(value)) throw new Error(`INVALID_INTEGER_${field.name}`);
    return { include: true as const, value };
  }
  if (field.type === "Float") {
    const value = Number(text);
    if (!Number.isFinite(value)) throw new Error(`INVALID_NUMBER_${field.name}`);
    return { include: true as const, value };
  }
  if (field.type === "DateTime") {
    const value = new Date(text);
    if (Number.isNaN(value.getTime())) throw new Error(`INVALID_DATE_${field.name}`);
    return { include: true as const, value };
  }
  if (field.type === "Enum" && field.enumValues && !field.enumValues.includes(text)) {
    throw new Error(`INVALID_ENUM_${field.name}`);
  }
  return { include: true as const, value: text };
}

export function buildAdminDataPayload(entity: AdminDataEntity, formData: FormData, mode: "create" | "update") {
  const data: Record<string, unknown> = {};
  for (const field of entity.fields) {
    const parsed = normalizeAdminFieldValue(field, formData.get(field.name), mode);
    if (parsed.include) data[field.name] = parsed.value;
  }
  return data;
}

export async function getAdminDataPage(entityKey: string, page = 1, pageSize = 20) {
  const { entity, delegate } = getAdminEntityDelegate(entityKey);
  const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1);
  const total = await delegate.count();
  const hasCreatedAt = entity.fields.some((field) => field.name === "createdAt");
  const records = await delegate.findMany({
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    ...(hasCreatedAt ? { orderBy: { createdAt: "desc" } } : {})
  });
  return { entity, records, total, page: safePage, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

function optionLabel(model: string, item: Record<string, unknown>) {
  const candidates = [
    "displayUsername",
    "username",
    "name",
    "displayName",
    "title",
    "studentCode",
    "teacherCode",
    "originalFilename",
    "action",
    "id"
  ];
  const value = candidates.map((key) => item[key]).find((candidate) => typeof candidate === "string" && candidate.length > 0);
  const id = String(item.id ?? "");
  return `${value ?? model}${value && String(value) !== id ? ` · ${id.slice(0, 12)}` : ""}`;
}

export async function getRelationOptions(entity: AdminDataEntity) {
  const models = [...new Set(entity.fields.map((field) => field.relationModel).filter((value): value is string => Boolean(value)))];
  const entries = await Promise.all(
    models.map(async (model) => {
      const delegate = getDelegateByName(delegateNameForModel(model));
      const rows = await delegate.findMany({ take: 250 });
      return [model, rows.map((row) => ({ id: String(row.id), label: optionLabel(model, row) }))] as const;
    })
  );
  return Object.fromEntries(entries) as Record<string, AdminRelationOption[]>;
}

export function serializeAdminValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return "";
  return String(value);
}

export function adminRecordLabel(record: Record<string, unknown>) {
  const candidates = ["name", "title", "displayName", "studentCode", "teacherCode", "originalFilename", "action"];
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return String(record.id ?? "Record");
}
