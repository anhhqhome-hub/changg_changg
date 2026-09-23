"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CheckCheck, Inbox, X } from "lucide-react";
import { markAllNotificationsReadAction } from "@/actions/notification-actions";
import { Button } from "@/components/ui/button";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell({
  locale,
  notifications
}: {
  locale: string;
  notifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const isEn = locale === "en";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label={isEn ? "Open notifications" : "Mở thông báo"}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button className="fixed inset-0 z-40 cursor-default" type="button" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <section className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h2 className="font-black text-slate-950">{isEn ? "Notifications" : "Thông báo"}</h2>
                <p className="text-xs font-medium text-slate-500">
                  {unreadCount ? `${unreadCount} ${isEn ? "unread" : "chưa đọc"}` : isEn ? "All caught up" : "Đã xem hết"}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {notifications.length ? (
                notifications.map((item) => {
                  const content = (
                    <div className={`rounded-xl p-3 ${item.readAt ? "bg-white" : "bg-indigo-50"}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 h-2 w-2 rounded-full ${item.readAt ? "bg-slate-200" : "bg-rose-500"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-950">{item.title}</p>
                          {item.body ? <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.body}</p> : null}
                          <p className="mt-2 text-[11px] font-semibold text-slate-400">{formatRelative(item.createdAt, isEn)}</p>
                        </div>
                      </div>
                    </div>
                  );
                  return item.href ? (
                    <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className="block rounded-xl hover:bg-slate-50">
                      {content}
                    </Link>
                  ) : (
                    <div key={item.id}>{content}</div>
                  );
                })
              ) : (
                <div className="grid place-items-center gap-2 p-8 text-center text-sm text-slate-500">
                  <Inbox className="h-8 w-8 text-slate-300" />
                  {isEn ? "No notifications yet." : "Chưa có thông báo nào."}
                </div>
              )}
            </div>

            {notifications.length ? (
              <form action={markAllNotificationsReadAction} className="border-t border-slate-100 p-3">
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit" variant="outline" size="sm" className="w-full">
                  <CheckCheck className="h-4 w-4" /> {isEn ? "Mark all as read" : "Đánh dấu đã đọc"}
                </Button>
              </form>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}

function formatRelative(value: string, isEn: boolean) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));
  if (minutes < 60) return isEn ? `${minutes}m ago` : `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return isEn ? `${hours}h ago` : `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  return isEn ? `${days}d ago` : `${days} ngày trước`;
}
