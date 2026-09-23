import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVietnamDateTime } from "@/lib/date";
import { prisma } from "@/lib/db";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <Card>
      <CardHeader><CardTitle>Audit logs</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-md border border-slate-200 p-3 text-sm">
            <p className="font-semibold">{log.action} · {log.entityType}</p>
            <p className="text-slate-600">{log.actor?.email ?? "System"} · {formatVietnamDateTime(log.createdAt)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
