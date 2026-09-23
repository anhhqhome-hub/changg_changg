import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { storageProvider } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const limit = checkRateLimit(`upload:${session.user.id}`, 20, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "TOO_MANY_UPLOADS" }, { status: 429 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  const stored = await storageProvider.upload(file, "audio");
  const asset = await prisma.mediaAsset.create({
    data: {
      ...stored,
      uploadedById: session.user.id,
      protected: true
    }
  });
  return NextResponse.json({ id: asset.id, url: `/api/media/${asset.id}` });
}
