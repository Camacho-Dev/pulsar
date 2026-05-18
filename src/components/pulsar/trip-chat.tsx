"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { MovementEvents } from "@/core/events";
import type { TripChatMessage } from "@/lib/trip-chat-store";
import { useSocket } from "@/lib/socket-client";
import { cn } from "@/lib/utils";

type Props = {
  movementId: string;
  userId: string;
  userName: string;
  role: "mover" | "pilot";
  otherPartyName: string;
  disabled?: boolean;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TripChat({
  movementId,
  userId,
  userName,
  role,
  otherPartyName,
  disabled,
}: Props) {
  const socketRef = useSocket();
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<TripChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/movement/${movementId}/chat`);
    if (res.ok) setMessages(await res.json());
  }, [movementId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("movement:join", { movementId, role });

    const onMsg = (msg: TripChatMessage) => {
      if (msg.movementId !== movementId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on(MovementEvents.CHAT_MESSAGE, onMsg);
    return () => {
      socket.off(MovementEvents.CHAT_MESSAGE, onMsg);
    };
  }, [movementId, role, socketRef]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending || disabled) return;

    setSending(true);
    setText("");

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("chat:send", {
        movementId,
        body,
        senderName: userName,
        senderRole: role,
      });
    } else {
      await fetch(`/api/movement/${movementId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      await load();
    }
    setSending(false);
  }

  const unreadHint = messages.filter((m) => m.senderId !== userId).length;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <MessageCircle className="h-4 w-4 text-cyan-400" />
          Chat con {otherPartyName}
        </span>
        <span className="text-xs text-zinc-500">
          {open ? "Ocultar" : `Abrir (${unreadHint})`}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-3 pb-3">
          <div className="mb-2 max-h-40 space-y-2 overflow-y-auto py-2">
            {messages.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-500">
                Escribe el primer mensaje para coordinar la recogida.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === userId;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex flex-col",
                      mine ? "items-end" : "items-start"
                    )}
                  >
                    <span className="mb-0.5 text-[10px] text-zinc-600">
                      {mine ? "Tu" : m.senderName} · {formatTime(m.createdAt)}
                    </span>
                    <p
                      className={cn(
                        "max-w-[90%] rounded-xl px-3 py-1.5 text-xs",
                        mine
                          ? "bg-violet-600/80 text-white"
                          : "bg-white/10 text-zinc-200"
                      )}
                    >
                      {m.body}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(e) => void send(e)} className="flex gap-2">
            <input
              type="text"
              value={text}
              disabled={disabled || sending}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                disabled ? "Viaje finalizado" : "Escribe un mensaje…"
              }
              maxLength={500}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={disabled || sending || !text.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
