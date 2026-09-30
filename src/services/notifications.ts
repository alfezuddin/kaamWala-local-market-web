import { byNewest, delay, makeId } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import type { AppNotification, NotificationCategory } from "@/types";

export async function getNotifications(userId: string, category?: NotificationCategory | "ALL") {
  const db = getDb();
  let list = db.notifications.filter((n) => n.userId === userId);
  if (category && category !== "ALL") list = list.filter((n) => n.category === category);
  return delay([...list].sort(byNewest), 240);
}

export async function markNotificationRead(id: string) {
  return mutate((db) => {
    const n = db.notifications.find((x) => x.id === id);
    if (n) n.isRead = true;
    return delay(n ?? null, 180);
  });
}

export async function markAllNotificationsRead(userId: string) {
  return mutate((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    return delay(true, 320);
  });
}

export async function getUnreadCount(userId: string) {
  const db = getDb();
  return delay(db.notifications.filter((n) => n.userId === userId && !n.isRead).length, 120);
}

export async function pushNotification(input: Omit<AppNotification, "id" | "createdAt" | "isRead">) {
  return mutate((db) => {
    const notification: AppNotification = {
      ...input,
      id: makeId("ntf"),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    db.notifications.unshift(notification);
    return delay(notification, 200);
  });
}
