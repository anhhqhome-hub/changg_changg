export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/db";
import { env } from "@/lib/env";
import { resolveDatabaseConnection } from "@/lib/runtime-database";

export async function GET() {
  const startedAt = Date.now();
  const connection = resolveDatabaseConnection(env.DATABASE_URL, env.DATABASE_AUTH_TOKEN);

  try {
    const prisma = getPrismaClient();
    await prisma.$queryRawUnsafe("SELECT 1");
    const user = await prisma.user.findFirst({ select: { id: true } });

    return NextResponse.json({
      ok: true,
      databaseMode: connection.mode,
      ephemeral: connection.ephemeral,
      hasSeedUser: Boolean(user?.id),
      durationMs: Date.now() - startedAt
    });
  } catch (error) {
    console.error("[health/database]", error);
    return NextResponse.json(
      {
        ok: false,
        databaseMode: connection.mode,
        ephemeral: connection.ephemeral,
        error: error instanceof Error ? error.message : "Unknown database error",
        durationMs: Date.now() - startedAt
      },
      { status: 500 }
    );
  }
}
