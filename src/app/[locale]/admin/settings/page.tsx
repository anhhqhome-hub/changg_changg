import Image from "next/image";
import { updateSiteSettingsAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFounderInfo, getSiteSettings } from "@/lib/site-settings";

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const [settings, previewVi, previewEn] = await Promise.all([
    getSiteSettings(),
    getFounderInfo("vi"),
    getFounderInfo("en")
  ]);
  const text = isEn
    ? {
        title: "Site settings",
        subtitle: "Configure the founder profile shown on the login page.",
        founder: "Founder profile",
        founderHint: "Shown as a trust badge on the login page. Leave a field empty to use the default label.",
        name: "Founder name",
        namePlaceholder: "e.g. Nguyen Thi Trang",
        titleVi: "Title (Vietnamese)",
        titleEn: "Title (English)",
        quoteVi: "Short quote (Vietnamese)",
        quoteEn: "Short quote (English)",
        save: "Save settings",
        preview: "Preview on login page",
        previewViLabel: "Vietnamese",
        previewEnLabel: "English"
      }
    : {
        title: "Cài đặt website",
        subtitle: "Cấu hình hồ sơ người sáng lập hiển thị ở trang đăng nhập.",
        founder: "Hồ sơ người sáng lập",
        founderHint: "Hiển thị như một dấu hiệu uy tín ở trang đăng nhập. Để trống để dùng nhãn mặc định.",
        name: "Tên người sáng lập",
        namePlaceholder: "VD: Nguyễn Thị Thùy Trang",
        titleVi: "Chức danh (Tiếng Việt)",
        titleEn: "Chức danh (Tiếng Anh)",
        quoteVi: "Câu trích ngắn (Tiếng Việt)",
        quoteEn: "Câu trích ngắn (Tiếng Anh)",
        save: "Lưu cài đặt",
        preview: "Xem trước ở trang đăng nhập",
        previewViLabel: "Tiếng Việt",
        previewEnLabel: "Tiếng Anh"
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase text-indigo-700">Admin</p>
        <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
        <p className="mt-1 text-sm font-medium text-slate-600">{text.subtitle}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>{text.founder}</CardTitle>
            <p className="text-sm text-slate-500">{text.founderHint}</p>
          </CardHeader>
          <CardContent>
            <form action={updateSiteSettingsAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="grid gap-1 text-sm font-bold">
                {text.name}
                <Input name="founderName" defaultValue={settings?.founderName ?? ""} placeholder={text.namePlaceholder} maxLength={120} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold">
                  {text.titleVi}
                  <Input name="founderTitle" defaultValue={settings?.founderTitle ?? ""} placeholder="Người sáng lập changg changg" maxLength={160} />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  {text.titleEn}
                  <Input name="founderTitleEn" defaultValue={settings?.founderTitleEn ?? ""} placeholder="Founder of changg changg" maxLength={160} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold">
                  {text.quoteVi}
                  <Textarea name="founderQuote" defaultValue={settings?.founderQuote ?? ""} maxLength={400} className="min-h-20" />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  {text.quoteEn}
                  <Textarea name="founderQuoteEn" defaultValue={settings?.founderQuoteEn ?? ""} maxLength={400} className="min-h-20" />
                </label>
              </div>
              <Button type="submit" className="w-fit">{text.save}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text.preview}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FounderPreview label={text.previewViLabel} founder={previewVi} />
            <FounderPreview label={text.previewEnLabel} founder={previewEn} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FounderPreview({ label, founder }: { label: string; founder: { name: string | null; title: string; quote: string | null; photoUrl: string } }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase text-slate-400">{label}</p>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-indigo-100">
          <Image src={founder.photoUrl} alt={founder.name ?? founder.title} fill sizes="48px" className="object-cover" />
        </div>
        <div className="min-w-0">
          {founder.name ? (
            <>
              <p className="truncate text-sm font-black text-slate-950">{founder.name}</p>
              <p className="truncate text-xs font-bold text-indigo-700">{founder.title}</p>
            </>
          ) : (
            <p className="truncate text-sm font-black text-slate-950">{founder.title}</p>
          )}
          {founder.quote ? <p className="mt-1 line-clamp-2 text-xs italic text-slate-500">&ldquo;{founder.quote}&rdquo;</p> : null}
        </div>
      </div>
    </div>
  );
}
