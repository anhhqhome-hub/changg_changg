import Link from "next/link";
import { Database, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { createAdminDataRecordAction, deleteAdminDataRecordAction, updateAdminDataRecordAction } from "@/actions/admin-data-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { adminDataCatalog, getAdminDataEntity, type AdminDataEntity, type AdminDataField } from "@/lib/admin-data-catalog";
import { adminRecordLabel, getAdminDataPage, getRelationOptions, serializeAdminValue, type AdminRelationOption } from "@/lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ entity?: string; page?: string; state?: string; message?: string }>;
};

export default async function AdminDataPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const isEn = locale === "en";
  const requested = query.entity ?? "school";
  const currentEntity = getAdminDataEntity(requested) ?? adminDataCatalog[0];
  const pageNumber = Number.parseInt(query.page ?? "1", 10) || 1;
  const [{ records, total, page, pageCount }, relationOptions] = await Promise.all([
    getAdminDataPage(currentEntity.key, pageNumber),
    getRelationOptions(currentEntity)
  ]);

  const text = isEn
    ? {
        title: "System data",
        subtitle: "Full CRUD for application data. Accounts and authentication secrets remain behind dedicated safe controls.",
        entity: "Data type",
        create: "Create record",
        edit: "Edit",
        remove: "Delete",
        save: "Save changes",
        createNow: "Create",
        confirmDelete: "Confirm deletion",
        confirmText: "This may cascade or be blocked by relational constraints. Delete this record?",
        empty: "No records in this data set.",
        total: "records",
        previous: "Previous",
        next: "Next",
        security: "Accounts & security",
        successCreated: "Record created.",
        successUpdated: "Record updated.",
        successDeleted: "Record deleted.",
        technicalHint: "Relation fields use IDs. Select from available referenced records when possible."
      }
    : {
        title: "Quản trị toàn bộ dữ liệu",
        subtitle: "Admin có thể CRUD toàn bộ dữ liệu nghiệp vụ. Account và bí mật xác thực vẫn đi qua màn hình quản trị an toàn riêng.",
        entity: "Loại dữ liệu",
        create: "Tạo dữ liệu",
        edit: "Sửa",
        remove: "Xóa",
        save: "Lưu thay đổi",
        createNow: "Tạo mới",
        confirmDelete: "Xác nhận xóa",
        confirmText: "Thao tác có thể cascade hoặc bị chặn bởi ràng buộc dữ liệu. Bạn chắc chắn muốn xóa bản ghi này?",
        empty: "Chưa có dữ liệu trong nhóm này.",
        total: "bản ghi",
        previous: "Trước",
        next: "Sau",
        security: "Account & bảo mật",
        successCreated: "Đã tạo dữ liệu.",
        successUpdated: "Đã cập nhật dữ liệu.",
        successDeleted: "Đã xóa dữ liệu.",
        technicalHint: "Các trường liên kết dùng ID. Hệ thống sẽ cho chọn bản ghi liên quan khi có thể."
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-indigo-700">Admin Data Center</p>
            <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-600">{text.subtitle}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/admin/users`}><ShieldCheck className="h-4 w-4" />{text.security}</Link>
          </Button>
        </div>
      </section>

      {query.state ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${query.state === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {query.state === "created" ? text.successCreated : query.state === "updated" ? text.successUpdated : query.state === "deleted" ? text.successDeleted : query.message ?? "Error"}
        </div>
      ) : null}

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <form method="get" className="grid gap-2">
            <label className="text-sm font-black text-slate-700" htmlFor="entity">{text.entity}</label>
            <select id="entity" name="entity" defaultValue={currentEntity.key} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold" onChange={undefined}>
              {adminDataCatalog.map((item) => <option key={item.key} value={item.key}>{isEn ? item.labelEn : item.labelVi} · {item.model}</option>)}
            </select>
            <Button type="submit" variant="outline" className="w-fit"><Database className="h-4 w-4" />{isEn ? "Open" : "Mở dữ liệu"}</Button>
          </form>

          <Modal title={`${text.create}: ${isEn ? currentEntity.labelEn : currentEntity.labelVi}`} triggerLabel={text.create} triggerIcon="plus">
            <AdminRecordForm entity={currentEntity} locale={locale} relationOptions={relationOptions} action={createAdminDataRecordAction} submitLabel={text.createNow} />
          </Modal>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{isEn ? currentEntity.labelEn : currentEntity.labelVi}</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{total} {text.total} · {text.technicalHint}</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{currentEntity.model}</span>
        </CardHeader>
        <CardContent className="grid gap-3">
          {records.length ? records.map((record) => (
            <article key={String(record.id)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">{adminRecordLabel(record)}</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-400">{String(record.id)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Modal title={`${text.edit}: ${adminRecordLabel(record)}`} triggerLabel={text.edit} triggerVariant="outline">
                    <AdminRecordForm entity={currentEntity} locale={locale} relationOptions={relationOptions} record={record} action={updateAdminDataRecordAction} submitLabel={text.save} />
                  </Modal>
                  <Modal title={text.confirmDelete} triggerLabel={text.remove} triggerVariant="secondary">
                    <p className="mb-4 text-sm text-slate-600">{text.confirmText}</p>
                    <form action={deleteAdminDataRecordAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="entity" value={currentEntity.key} />
                      <input type="hidden" name="recordId" value={String(record.id)} />
                      <Button type="submit" variant="destructive"><Trash2 className="h-4 w-4" />{text.remove}</Button>
                    </form>
                  </Modal>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {currentEntity.fields.filter((field) => field.name !== "id").slice(0, 8).map((field) => (
                  <div key={field.name} className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{field.name}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-700" title={serializeAdminValue(record[field.name]) || "—"}>{serializeAdminValue(record[field.name]) || "—"}</p>
                  </div>
                ))}
              </div>
            </article>
          )) : <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{text.empty}</p>}

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" asChild={page > 1} disabled={page <= 1}>
                {page > 1 ? <Link href={`/${locale}/admin/data?entity=${currentEntity.key}&page=${page - 1}`}>{text.previous}</Link> : <span>{text.previous}</span>}
              </Button>
              <span className="text-sm font-bold text-slate-500">{page}/{pageCount}</span>
              <Button variant="outline" asChild={page < pageCount} disabled={page >= pageCount}>
                {page < pageCount ? <Link href={`/${locale}/admin/data?entity=${currentEntity.key}&page=${page + 1}`}>{text.next}</Link> : <span>{text.next}</span>}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminRecordForm({
  entity,
  locale,
  relationOptions,
  record,
  action,
  submitLabel
}: {
  entity: AdminDataEntity;
  locale: string;
  relationOptions: Record<string, AdminRelationOption[]>;
  record?: Record<string, unknown>;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="entity" value={entity.key} />
      {record ? <input type="hidden" name="recordId" value={String(record.id)} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {entity.fields.map((field) => (
          <AdminFieldInput key={field.name} field={field} value={record?.[field.name]} relationOptions={field.relationModel ? relationOptions[field.relationModel] ?? [] : []} isCreate={!record} />
        ))}
      </div>
      <Button type="submit" className="mt-2 w-fit">{record ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{submitLabel}</Button>
    </form>
  );
}

function AdminFieldInput({ field, value, relationOptions, isCreate }: { field: AdminDataField; value: unknown; relationOptions: AdminRelationOption[]; isCreate: boolean }) {
  const serialized = serializeAdminValue(value);
  if (field.readOnly) {
    if (isCreate) return null;
    return (
      <label className="grid gap-1 text-sm font-bold text-slate-500">
        {field.name}
        <Input value={serialized} readOnly disabled />
      </label>
    );
  }
  const required = field.required && !(isCreate && field.hasDefault);
  if (field.relationModel && relationOptions.length) {
    return (
      <label className="grid gap-1 text-sm font-bold text-slate-700">
        {field.name} <span className="text-[10px] font-semibold text-slate-400">→ {field.relationModel}</span>
        <select name={field.name} defaultValue={serialized} required={required} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium">
          {!required ? <option value="">—</option> : null}
          {relationOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === "Boolean") {
    return (
      <label className="grid gap-1 text-sm font-bold text-slate-700">
        {field.name}
        <select name={field.name} defaultValue={serialized || (field.hasDefault && isCreate ? "" : "false")} required={required} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium">
          {field.hasDefault && isCreate ? <option value="">default</option> : null}
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>
    );
  }
  if (field.type === "Enum") {
    return (
      <label className="grid gap-1 text-sm font-bold text-slate-700">
        {field.name}
        <select name={field.name} defaultValue={serialized} required={required} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium">
          {!required || (isCreate && field.hasDefault) ? <option value="">default / none</option> : null}
          {field.enumValues?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === "DateTime") {
    return (
      <label className="grid gap-1 text-sm font-bold text-slate-700">
        {field.name}
        <Input type="datetime-local" name={field.name} defaultValue={toDateTimeLocal(serialized)} required={required} />
      </label>
    );
  }
  const isLongText = /body|prompt|description|instructions|notes|comments|feedback|Json|quote|descriptors/i.test(field.name);
  if (isLongText) {
    return (
      <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
        {field.name}
        <Textarea name={field.name} defaultValue={serialized} required={required} className="min-h-24 font-mono text-xs" />
      </label>
    );
  }
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {field.name}
      <Input
        name={field.name}
        type={field.type === "Int" || field.type === "Float" ? "number" : "text"}
        step={field.type === "Float" ? "any" : undefined}
        defaultValue={serialized}
        required={required}
      />
    </label>
  );
}

function toDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
