"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Bot, FileText, Clock3, Plus } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

type TaskRow = {
  id: string;
  prompt: string;
  createdAt: string;
  agent: { name: string };
  sessions: { status: string }[];
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
    <div className="overflow-hidden rounded-2xl border border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-900 text-neutral-400">
          <tr>
            <th className="px-4 py-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Bot className="size-3.5" />
                Agente
              </span>
            </th>
            <th className="px-4 py-2 font-medium">
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Tarefa
              </span>
            </th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                Criada em
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-neutral-900/60">
              <td className="px-4 py-3">{task.agent.name}</td>
              <td className="max-w-md truncate px-4 py-3 text-neutral-300">
                <Link href={`/tasks/${task.id}`} className="hover:underline">
                  {task.prompt}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={task.sessions[0]?.status ?? "pending"} />
              </td>
              <td className="px-4 py-3 text-neutral-400">
                {new Date(task.createdAt).toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
