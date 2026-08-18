"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Bot, MessageSquareText, Info, Paperclip, Loader2, Send, AlertCircle } from "lucide-react";

type Agent = { id: string; name: string };

export function TaskForm({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(): Promise<string[]> {
    if (!files || files.length === 0) return [];
    const paths: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`falha ao enviar ${file.name}`);
      const data = await res.json();
      paths.push(data.path);
    }
    return paths;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const attachments = await uploadFiles();
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          prompt,
          extraContext: extraContext || undefined,
          attachments,
        }),
      });

      if (!res.ok) throw new Error("falha ao criar tarefa");

      const data = await res.json();
      router.push(`/tasks/${data.task.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro inesperado");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-neutral-800 p-4">
      <label className="block space-y-1 text-sm">
        <span className="flex items-center gap-1.5 text-neutral-400">
          <Bot className="size-4" />
          Agente
        </span>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 text-sm">
        <span className="flex items-center gap-1.5 text-neutral-400">
          <MessageSquareText className="size-4" />
          O que o Claude deve fazer
        </span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={5}
          placeholder="Implemente o endpoint X seguindo o padrão do módulo Y..."
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="flex items-center gap-1.5 text-neutral-400">
          <Info className="size-4" />
          Contexto adicional (opcional)
        </span>
        <textarea
          value={extraContext}
          onChange={(e) => setExtraContext(e.target.value)}
          rows={3}
          placeholder="Detalhes, links, decisões já tomadas..."
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="flex items-center gap-1.5 text-neutral-400">
          <Paperclip className="size-4" />
          Arquivos anexos (opcional)
        </span>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200"
        />
        {files && files.length > 0 && (
          <ul className="space-y-1 pt-1">
            {Array.from(files).map((file) => (
              <li key={file.name} className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Paperclip className="size-3" />
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </label>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-400">
          <AlertCircle className="size-4" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !agentId}
        className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {submitting ? "Disparando sessão…" : "Disparar tarefa"}
      </button>
    </form>
  );
}
