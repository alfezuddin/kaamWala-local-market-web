"use client";

import * as React from "react";
import { Check, CheckCheck, FileText } from "lucide-react";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

export function ChatMessage({
  message,
  isOwn,
  senderName,
  showAvatar = true,
}: {
  message: Message;
  isOwn: boolean;
  senderName: string;
  showAvatar?: boolean;
}) {
  return (
    <div className={cn("flex items-end gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}>
      {showAvatar && (
        <AvatarCircle name={senderName} size="xs" className={cn("mb-0.5", !showAvatar && "invisible")} />
      )}
      <div className={cn("max-w-[78%] sm:max-w-[65%]", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-soft",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
          )}
        >
          {message.attachment && (
            <div className="bg-background/15 dark:bg-black/10 mb-2 flex items-center gap-2 rounded-lg p-2.5">
              <FileText className="size-4 shrink-0" />
              <span className="truncate text-xs font-medium">{message.attachment.name}</span>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
        <p className={cn("mt-1 flex items-center gap-1 text-[11px] text-muted-foreground", isOwn ? "justify-end" : "justify-start")}>
          {new Date(message.createdAt).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit" })}
          {isOwn &&
            (message.isRead ? (
              <CheckCheck className="size-3.5 text-primary" aria-label="Read" />
            ) : (
              <Check className="size-3.5" aria-label="Sent" />
            ))}
        </p>
      </div>
    </div>
  );
}

export function ChatTyping({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2.5">
      <AvatarCircle name={name} size="xs" />
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 shadow-soft">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="bg-muted-foreground size-1.5 animate-bounce rounded-full"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      </div>
      <span className="sr-only">{name} is typing</span>
    </div>
  );
}
