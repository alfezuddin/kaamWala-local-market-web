import { byNewest, delay, makeId } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import type { Conversation, Message } from "@/types";

export async function getConversations(userId: string) {
  const db = getDb();
  const list = db.conversations
    .filter((c) => c.customerId === userId || c.workerId === userId)
    .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt))
    .map((c) => {
      const otherId = c.customerId === userId ? c.workerId : c.customerId;
      const other =
        db.workers.find((w) => w.id === otherId) ?? db.customers.find((x) => x.id === otherId) ?? null;
      const messages = db.messages.filter((m) => m.conversationId === c.id);
      return {
        ...c,
        counterpart: other,
        counterpartRole: c.customerId === userId ? ("WORKER" as const) : ("CUSTOMER" as const),
        lastMessage: messages.sort(byNewest)[0] ?? null,
      };
    });
  return delay(list, 280);
}

export async function getConversation(userId: string, conversationId: string) {
  const db = getDb();
  const conversation = db.conversations.find((c) => c.id === conversationId) ?? null;
  if (!conversation) return delay(null, 220);
  const messages = db.messages.filter((m) => m.conversationId === conversationId).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const otherId = conversation.customerId === userId ? conversation.workerId : conversation.customerId;
  const counterpart =
    db.workers.find((w) => w.id === otherId) ?? db.customers.find((x) => x.id === otherId) ?? null;
  mutate((db2) => {
    const c = db2.conversations.find((x) => x.id === conversationId);
    if (c) c.unreadCount = 0;
    db2.messages.filter((m) => m.conversationId === conversationId && m.senderId !== userId).forEach((m) => {
      m.isRead = true;
    });
    return true;
  });
  return delay({ conversation: { ...conversation, unreadCount: 0 }, messages, counterpart }, 260);
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  return mutate((db) => {
    const message: Message = {
      id: makeId("msg"),
      conversationId,
      senderId,
      text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    db.messages.push(message);
    const conversation = db.conversations.find((c) => c.id === conversationId);
    if (conversation) {
      conversation.lastMessageAt = message.createdAt;
      conversation.unreadCount += 1;
    }
    return delay(message, 320);
  });
}

export async function startConversation(customerId: string, workerId: string, bookingId?: string) {
  return mutate((db) => {
    const id = `cnv_${customerId}_${workerId}`;
    const existing = db.conversations.find((c) => c.id === id);
    if (existing) return delay(existing, 200);
    const conversation: Conversation = {
      id,
      customerId,
      workerId,
      bookingId,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };
    db.conversations.unshift(conversation);
    return delay(conversation, 300);
  });
}

/** Admin console: every conversation, enriched with both parties and the linked job. */
export async function getAdminConversations(filters: { search?: string; bookingId?: string } = {}) {
  const db = getDb();
  let list = [...db.conversations].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  if (filters.bookingId) list = list.filter((c) => c.bookingId === filters.bookingId);
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter((c) => {
      const customer = db.customers.find((x) => x.id === c.customerId);
      const worker = db.workers.find((w) => w.id === c.workerId);
      return (
        c.id.toLowerCase().includes(q) ||
        (c.bookingId ?? "").toLowerCase().includes(q) ||
        (customer?.name.toLowerCase().includes(q) ?? false) ||
        (worker?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }
  return delay(
    list.map((c) => {
      const messages = db.messages.filter((m) => m.conversationId === c.id);
      return {
        ...c,
        customer: db.customers.find((x) => x.id === c.customerId) ?? null,
        worker: db.workers.find((w) => w.id === c.workerId) ?? null,
        booking: c.bookingId ? (db.bookings.find((b) => b.id === c.bookingId) ?? null) : null,
        messageCount: messages.length,
        lastMessage: messages.sort(byNewest)[0] ?? null,
      };
    }),
    280,
  );
}

/** Admin console: read a thread and post a moderation note visible to both parties. */
export async function getAdminConversation(conversationId: string) {
  const db = getDb();
  const conversation = db.conversations.find((c) => c.id === conversationId) ?? null;
  if (!conversation) return delay(null, 220);
  return delay(
    {
      conversation,
      customer: db.customers.find((x) => x.id === conversation.customerId) ?? null,
      worker: db.workers.find((w) => w.id === conversation.workerId) ?? null,
      booking: conversation.bookingId
        ? (db.bookings.find((b) => b.id === conversation.bookingId) ?? null)
        : null,
      messages: db.messages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    },
    240,
  );
}

/** Admin console: send a message as the KaamWala support account. */
export async function sendAdminMessage(conversationId: string, text: string, senderId = "adm_demo") {
  return mutate((db) => {
    const conversation = db.conversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error("Conversation not found");
    const message: Message = {
      id: makeId("msg"),
      conversationId,
      senderId,
      text,
      createdAt: new Date().toISOString(),
      isRead: true,
    };
    db.messages.push(message);
    conversation.lastMessageAt = message.createdAt;
    return delay(message, 300);
  });
}
