export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storageProvider } from "@/lib/storage";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const canRead =
    asset.uploadedById === session.user.id ||
    Boolean(
      await prisma.examAttempt.findFirst({
        where: {
          OR: [
            { studentId: session.user.id, answers: { some: { audioAssetId: id } } },
            { assignment: { exam: { createdById: session.user.id } }, answers: { some: { audioAssetId: id } } }
          ]
        },
        select: { id: true }
      })
    );
  if (asset.protected && !canRead) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const resolved = await storageProvider.resolve(asset.storageKey);
  if (!resolved) return NextResponse.json({ error: "FILE_MISSING" }, { status: 404 });
  const bytes = await readFile(resolved);
  return new NextResponse(bytes, {
    headers: {
      "content-type": asset.mimeType,
      "cache-control": "private, max-age=3600"
    }
  });
}
