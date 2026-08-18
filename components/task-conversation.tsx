"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import {
  StopCircle,
  MessageSquareText,
  Wrench,
  Info,
  CheckCircle2,
  XCircle,
  Radio,
  Send,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { summarizeMessage, type TranscriptLine } from "@/lib/claude/format-message";

type SessionTurn = {
  id: string;
  userMessage: string;
  status: string;
  transcript: SDKMessage[];
};

type StreamEvent =
  | { type: "snapshot"; status: string; transcript: SDKMessage[] }
  | { type: "status"; status: string }
  | { type: "message"; message: SDKMessage }
  | { type: "done" }
  | { type: "error"; error: string };

const LINE_ICONS: Record<TranscriptLine["kind"], LucideIcon> = {
  text: MessageSquareText,
  tool: Wrench,
  system: Info,
  result: CheckCircle2,
  other: Radio,
};

const ACTIVE_STATUSES = new Set(["queued", "running"]);

function TranscriptView({ lines }: { lines: TranscriptLine[] }) {
  return (
    <div className="space-y-3">
      {lines.map((line) => {
        const Icon = LINE_ICONS[line.kind] ?? Radio;
        const isErrorResult = line.kind === "result" && line.label === "erro";
        return (
          <div key={line.id} className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-neutral-500">
              {isErrorResult ? <XCircle className="size-3.5" /> : <Icon className="size-3.5" />}
              {line.label}
            </p>
            <pre className="whitespace-pre-wrap break-words text-neutral-200">{line.body}</pre>
          </div>
        );
      })}
    </div>
  );
}

export function TaskConversation({
  taskId,
  sessions: initialSessions,
}: {
  taskId: string;
  sessions: SessionTurn[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const latest = sessions[sessions.length - 1];
  const latestId = latest?.id;
  const isActive = latest ? ACTIVE_STATUSES.has(latest.status) : false;

  useEffect(() => {
    if (!latestId || !isActive) return;

    const source = new EventSource(`/api/sessions/${latestId}/stream`);

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as StreamEvent;

      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === latestId);
        if (idx === -1) return prev;
        const next = [...prev];

        if (payload.type === "snapshot") {
          next[idx] = { ...next[idx], status: payload.status, transcript: payload.transcript };
        } else if (payload.type === "status") {
          next[idx] = { ...next[idx], status: payload.status };
        } else if (payload.type === "message") {
          next[idx] = { ...next[idx], transcript: [...next[idx].transcript, payload.message] };
        }

        return next;
      });

      if (payload.type === "done") source.close();
    };

    source.onerror = () => source.close();

    return () => source.close();
  }, [latestId, isActive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions]);

  async function onCancel() {
    if (!latestId) return;
    await fetch(`/api/sessions/${latestId}/cancel`, { method: "POST" });
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    setError(null);

    const res = await fetch(`/api/tasks/${taskId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível enviar a resposta.");
      return;
    }

    const data = await res.json();
    setSessions((prev) => [
      ...prev,
      { id: data.session.id, userMessage: replyText, status: "queued", transcript: [] },
    ]);
    setReplyText("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {latest && <StatusBadge status={latest.status} />}
        {isActive && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-lg border border-red-800 px-3 py-1 text-xs text-red-400 hover:bg-red-950"
          >
            <StopCircle className="size-3.5" />
            Cancelar
          </button>
        )}
      </div>

      <div className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm">
        {sessions.map((turn) => (
          <div key={turn.id} className="space-y-3 border-b border-neutral-900 pb-6 last:border-0 last:pb-0">
            <div className="flex items-start gap-2 rounded-xl bg-neutral-900 p-3">
              <User className="mt-0.5 size-3.5 shrink-0 text-neutral-500" />
              <pre className="whitespace-pre-wrap break-words text-neutral-300">{turn.userMessage}</pre>
            </div>
            <TranscriptView lines={turn.transcript.flatMap(summarizeMessage)} />
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="flex items-center gap-2 text-neutral-500">
            <Radio className="size-4 animate-pulse" />
            Aguardando eventos…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onReply} className="space-y-2">
        <label className="block space-y-1 text-sm">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <MessageSquareText className="size-4" />
            Responder (continua com o contexto desta tarefa)
          </span>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={isActive}
            rows={3}
            placeholder={
              isActive
                ? "Aguarde a sessão atual terminar para responder…"
                : "Peça um ajuste, tire uma dúvida sobre o que foi feito, ou continue a tarefa..."
            }
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 disabled:opacity-50"
          />
        </label>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle className="size-4" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isActive || sending || !replyText.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {sending ? "Enviando…" : "Responder"}
        </button>
      </form>
    </div>
  );
}
