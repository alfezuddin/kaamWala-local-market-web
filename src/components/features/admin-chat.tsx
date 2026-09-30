"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {  Search, SendHorizontal, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getAdminConversation, getAdminConversations, sendAdminMessage } from "@/services/chat";
import { formatDateTime, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AdminChatPage() {
  const params = useSearchParams();
  const toast = useToast();
  const dbVersion = useDbVersion();
  const [search, setSearch] = React.useState("");
  const [chosenId, setChosenId] = React.useState<string | null>(params.get("conversation"));
  const [draft, setDraft] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const listQuery = useApiQuery(
    ["admin", "conversations", search, dbVersion],
    () => getAdminConversations({ search: search.trim() || undefined }),
  );

  const conversations = listQuery.data ?? [];
  // A ?booking= link opens the matching thread until the admin picks another one.
  const bookingId = params.get("booking");
  const selectedId =
    chosenId ?? (bookingId ? (conversations.find((c) => c.bookingId === bookingId)?.id ?? null) : null);

  const threadQuery = useApiQuery(
    ["admin", "conversation", selectedId, dbVersion],
    () => (selectedId ? getAdminConversation(selectedId) : Promise.resolve(null)),
    { enabled: Boolean(selectedId) },
  );

  const send = useApiMutation(
    (vars: { id: string; text: string }) => sendAdminMessage(vars.id, vars.text),
    {
      onSuccess: () => {
        setDraft("");
        threadQuery.refetch();
        listQuery.refetch();
      },
      onError: (error) => toast.error("Message not sent", error.message),
    },
  );

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [threadQuery.data]);
  const thread = threadQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support chat"
        description="Read customer and professional conversations and step in when needed."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Chat" }]}
      />

      <InfoBanner
        variant="info"
        icon={<ShieldCheck />}
        title="Admin replies are visible to both parties"
        description="Anything you send here appears in the live thread and is treated as official KaamWala support."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people or booking…"
              icon={<Search />}
              aria-label="Search conversations…"
            />
            {listQuery.isLoading ? (
              <SectionLoader label="Loading conversations…" />
            ) : conversations.length === 0 ? (
              <EmptyState compact icon="chat" title="No conversations" description="Nothing matches this search." />
            ) : (
              <ul className="max-h-[32rem] space-y-1.5 overflow-y-auto">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setChosenId(c.id)}
                      aria-pressed={selectedId === c.id}
                      className={cn(
                        "w-full rounded-xl border p-2.5 text-left transition",
                        selectedId === c.id
                          ? "border-brand bg-brand-soft/50"
                          : "border-border hover:border-brand/40",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <AvatarCircle name={c.worker?.name ?? c.customer?.name ?? "?"} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {c.customer?.name ?? "Removed"} ↔ {c.worker?.name ?? "Removed"}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {c.lastMessage?.text ?? "No messages yet"}
                          </p>
                        </div>
                        <span className="text-muted-foreground shrink-0 text-[11px]">
                          {formatTimeAgo(c.lastMessageAt)}
                        </span>
                      </div>
                      {c.bookingId && (
                        <p className="text-muted-foreground mt-1.5 text-[11px]">Booking {c.bookingId}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {!selectedId ? (
          <Card>
            <CardContent className="flex min-h-96 items-center justify-center">
              <EmptyState
                icon="chat"
                title="Select a conversation"
                description="Pick a thread to review the full history."
              />
            </CardContent>
          </Card>
        ) : threadQuery.isLoading ? (
          <SectionLoader label="Loading thread…" />
        ) : !thread ? (
          <Card>
            <CardContent className="flex min-h-96 items-center justify-center">
              <EmptyState
                icon="search"
                title="Conversation not found"
                description="This thread may have been closed."
                actionLabel="Back to list"
                onAction={() => setChosenId(null)}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="flex min-h-[36rem] flex-col">
            <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b p-4">
              <div>
                <p className="text-sm font-semibold">
                  {thread.customer?.name ?? "Removed customer"} ↔ {thread.worker?.name ?? "Removed professional"}
                </p>
                <p className="text-muted-foreground text-[13px]">
                  {thread.booking ? (
                    <>
                      Booking{" "}
                      <Button asChild variant="link" className="h-auto p-0 text-[13px]">
                        <Link href={`/admin/bookings/${thread.booking.id}`}>{thread.booking.id}</Link>
                      </Button>{" "}
                      · {thread.booking.title}
                    </>
                  ) : (
                    "No booking linked"
                  )}
                </p>
              </div>
              <Badge variant="outline">{thread.messages.length} messages</Badge>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {thread.messages.map((m) => {
                const isAdmin = m.senderId === "adm_demo";
                const fromCustomer = m.senderId === thread.conversation.customerId;
                return (
                  <div key={m.id} className={cn("flex", isAdmin ? "justify-center" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                        isAdmin
                          ? "bg-brand text-white"
                          : fromCustomer
                            ? "bg-muted"
                            : "bg-info-soft text-foreground",
                      )}
                    >
                      {isAdmin && (
                        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                          KaamWala support
                        </p>
                      )}
                      <p className="leading-relaxed">{m.text}</p>
                      <p className={cn("mt-1 text-[11px]", isAdmin ? "opacity-75" : "text-muted-foreground")}>
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-border space-y-2 border-t p-3">
              <Textarea
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a reply as KaamWala support…"
                aria-label="Support reply"
              />
              <div className="flex justify-end">
                <Button
                  loading={send.isPending}
                  disabled={draft.trim().length < 2}
                  icon={<SendHorizontal />}
                  onClick={() => {
                    const text = draft.trim();
                    if (text) send.mutate({ id: thread.conversation.id, text });
                  }}
                >
                  Send reply
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
