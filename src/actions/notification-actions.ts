"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function markAllNotificationsReadAction(formData: FormData) {
  const locale = String(formData.get("locale") || "vi");
  const user = await requireUser(locale);
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() }
  });
  revalidatePath(`/${locale}`);
}
