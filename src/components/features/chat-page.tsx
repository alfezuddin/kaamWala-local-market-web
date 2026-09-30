"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCheck, Paperclip, Phone, Search, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { ChatMessage, ChatTyping } from "@/components/ui/chat-message";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { getConversation, getConversations, sendMessage } from "@/services/chat";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Conversation, Message, User } from "@/types";

type ConversationRow = Conversation & {
  counterpart: User | null;
  counterpartRole: "WORKER" | "CUSTOMER";
  lastMessage: Message | null;
};

const QUICK_REPLIES = [
  "What time will you reach?",
  "Please bring your own tools",
  "Is the visit charge included?",
  "Thank you, see you soon",
];

export function ChatPage({ basePath }: { basePath: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.userId ?? "";
  const [pickedId, setPickedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  const listQuery = useApiQuery(["chat", "list", userId], () => getConversations(userId), {
    enabled: Boolean(userId),
  });

  const rows = (listQuery.data ?? []) as ConversationRow[];

  // Deep links: /chat?conversation=id, /chat?booking=id, /chat?worker=id. Once the
  // user picks a thread themselves the deep link is dropped from the URL.
  const wantedConversation = params.get("conversation");
  const wantedBooking = params.get("booking");
  const wantedWorker = params.get("worker");
  const deepLinkId =
    (wantedConversation && rows.some((r) => r.id === wantedConversation) ? wantedConversation : null) ??
    (wantedBooking ? (rows.find((r) => r.bookingId === wantedBooking)?.id ?? null) : null) ??
    (wantedWorker ? (rows.find((r) => r.counterpart?.id === wantedWorker)?.id ?? null) : null);
  const hasDeepLink = Boolean(wantedConversation || wantedBooking || wantedWorker);
  const activeId = pickedId ?? deepLinkId ?? (hasDeepLink ? null : (rows[0]?.id ?? null));

  const conversationQuery = useApiQuery(
    ["chat", "thread", activeId, userId],
    () => (activeId ? getConversation(userId, activeId) : Promise.resolve(null)),
    { enabled: Boolean(userId && activeId) },
  );

  const send = useApiMutation((vars: { conversationId: string; text: string }) => sendMessage(vars.conversationId, userId, vars.text), {
    onSuccess: () => {
      conversationQuery.refetch();
      listQuery.refetch();
      setTyping(true);
      window.setTimeout(() => setTyping(false), 2200);
    },
    onError: (error) => toast.error("Message not sent", error.message),
  });

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversationQuery.data?.messages?.length, typing]);

  const filtered = rows.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (c.counterpart?.name ?? "").toLowerCase().includes(q);
  });

  const selectThread = (id: string | null) => {
    setPickedId(id);
    if (hasDeepLink) {
      router.replace(pathname, { scroll: false });
    }
  };


  const onSend = () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    setDraft("");
    send.mutate(
      { conversationId: activeId, text },
      { onSettled: () => setSending(false) },
    );
  };

  const active = conversationQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Talk to your professional before, during and after the job."
        breadcrumbs={[{ label: "Chat", href: `${basePath}/chat` }]}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit overflow-hidden lg:sticky lg:top-24">
          <div className="border-b border-border p-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              icon={<Search />}
              aria-label="Search conversations…"
            />
          </div>
          <div className="max-h-[28rem] overflow-y-auto scrollbar-thin lg:max-h-[calc(100dvh-16rem)]">
            {listQuery.isLoading ? (
              <SectionLoader label="Loading chats…" />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="chat"
                compact
                title="No conversations"
                description="Chats start automatically when a booking is created."
                actionLabel="Book a service"
                actionHref={`${basePath}/book/new`}
              />
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectThread(c.id)}
                  className={cn(
                    "hover:bg-accent/60 flex w-full items-center gap-3 border-b border-border p-3 text-left transition",
                    activeId === c.id && "bg-brand-soft/50",
                  )}
                >
                  <AvatarCircle
                    name={c.counterpart?.name ?? "KaamWala"}
                    size="md"
                    online={c.counterpart && "isOnline" in c.counterpart ? Boolean(c.counterpart.isOnline) : false}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{c.counterpart?.name ?? "KaamWala"}</p>
                      {c.lastMessage && (
                        <span className="text-muted-foreground ml-auto shrink-0 text-[11px]">
                          {formatTimeAgo(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate text-[13px]">
                      {c.lastMessage?.text ?? "No messages yet"}
                    </p>
                  </div>
                  {c.unreadCount > 0 && (
                    <Badge variant="solid" size="sm">
                      {c.unreadCount}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="flex min-h-[30rem] flex-col overflow-hidden">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon="chat"
                title="Select a conversation"
                description="Pick a chat on the left to see your messages."
              />
            </div>
          ) : conversationQuery.isLoading ? (
            <SectionLoader label="Loading messages…" />
          ) : !active ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon="chat"
                title="Conversation not found"
                description="This conversation may have been removed."
                actionLabel="Back to inbox"
                onAction={() => selectThread(null)}
              />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border p-3">
                <AvatarCircle name={active.counterpart?.name ?? "KaamWala"} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{active.counterpart?.name ?? "KaamWala"}</p>
                  <p className="text-muted-foreground text-[13px]">
                    {active.conversation.bookingId ? `Booking ${active.conversation.bookingId}` : "General enquiry"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {active.counterpart && "id" in active.counterpart && (
                    <Button asChild variant="ghost" size="icon-sm" aria-label="View profile">
                      <Link href={`/workers/${active.counterpart.id}`}>
                        <Star />
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Call"
                    onClick={() =>
                      toast.info(
                        "Calling…",
                        "Your number is shared with the professional only for this booking.",
                      )
                    }
                  >
                    <Phone />
                  </Button>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
                {(active.messages ?? []).map((message, i) => {
                  const isOwn = message.senderId === userId;
                  const prev = (active.messages ?? [])[i - 1];
                  const showAvatar = !prev || prev.senderId !== message.senderId;
                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      senderName={isOwn ? "You" : (active.counterpart?.name ?? "KaamWala")}
                      showAvatar={showAvatar}
                    />
                  );
                })}
                {typing && <ChatTyping name={active.counterpart?.name ?? "KaamWala"} />}
                <div ref={endRef} />
              </div>

              <div className="border-t border-border p-3">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => setDraft(reply)}
                      className="border-border text-muted-foreground hover:border-brand hover:text-brand rounded-full border px-2.5 py-1 text-xs transition"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message…"
                    aria-label="Message"
                    className="min-h-10 flex-1 resize-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Attach a file"
                    onClick={() => toast.info("Attachments", "File uploads are disabled in this demo build.")}
                  >
                    <Paperclip />
                  </Button>
                  <Button onClick={onSend} loading={sending} disabled={!draft.trim()} aria-label="Send message">
                    <Send />
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                  <CheckCheck className="size-3.5" />
                  Messages are stored on this device. Press Enter to send, Shift+Enter for a new line.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
