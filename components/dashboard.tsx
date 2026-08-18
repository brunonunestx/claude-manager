"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, Bot, Clock3, Plus, Send, Loader2, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

type TaskRow = {
  id: string;
  prompt: string;
  createdAt: string;
  agent: { name: string };
  sessions: { status: string }[];
};

const ACTIVE_STATUSES = new Set(["queued", "running"]);

const BORDER_BY_STATUS: Record<string, string> = {
  running: "border-blue-600/60",
  done: "border-green-600/60",
};

export function Dashboard() {
  const [tasks, setTasks] = useState<TaskRow[] | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!active) return;
      if (res.ok) setTasks(await res.json());
    }

    load();
    // Simple polling keeps the dashboard fresh without extra wiring; the
    // task conversation page uses SSE for live transcript streaming.
    const interval = setInterval(load, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (tasks === null) {
    return <p className="text-neutral-400">Carregando tarefas…</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-800 p-10 text-center text-neutral-400">
        <Inbox className="size-8 text-neutral-600" />
        <p>Nenhuma tarefa ainda.</p>
        <Link
          href="/tasks/new"
          className="mt-1 inline-flex items-center gap-1 text-orange-500 hover:underline"
        >
          <Plus className="size-4" />
          Criar a primeira tarefa
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: TaskRow }) {
  const router = useRouter();
  const status = task.sessions[0]?.status ?? "pending";
  const isActive = ACTIVE_STATUSES.has(status);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openConversation() {
    router.push(`/tasks/${task.id}`);
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    setError(null);

    const res = await fetch(`/api/tasks/${task.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível enviar a instrução.");
      return;
    }

    setReplyText("");
    router.push(`/tasks/${task.id}`);
  }

  return (
    <div
      onClick={openConversation}
      className={`flex cursor-pointer flex-col gap-3 rounded-2xl border bg-neutral-950 p-4 transition-colors hover:border-neutral-600 ${
        BORDER_BY_STATUS[status] ?? "border-neutral-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm text-neutral-300">
          <Bot className="size-3.5" />
          {task.agent.name}
        </span>
        <StatusBadge status={status} />
      </div>

      <p className="line-clamp-3 text-sm text-neutral-200">{task.prompt}</p>

      <span className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Clock3 className="size-3" />
        {new Date(task.createdAt).toLocaleString("pt-BR")}
      </span>

      <form onSubmit={onReply} onClick={(e: MouseEvent) => e.stopPropagation()} className="mt-1 space-y-1.5">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          disabled={isActive}
          rows={2}
          placeholder={isActive ? "Sessão em execução…" : "Enviar instrução para esta sessão…"}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-sm disabled:opacity-50"
        />

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="size-3.5" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isActive || sending || !replyText.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-500 disabled:opacity-50"
        >
          {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          {sending ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
