"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2, Plus, AlertCircle } from "lucide-react";

export function AgentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cwd, setCwd] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [contextFiles, setContextFiles] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        cwd,
        systemPrompt,
        contextFiles: contextFiles
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Não foi possível criar o agente. Confira os campos.");
      return;
    }

    setName("");
    setCwd("");
    setSystemPrompt("");
    setContextFiles("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-neutral-800 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-neutral-400">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Scoder"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-neutral-400">Diretório do projeto (cwd)</span>
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="/home/bruno/Workspace/Projects/scoder"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-neutral-400">System prompt</span>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          required
          rows={4}
          placeholder="Você é o agente de desenvolvimento do projeto Scoder. Conhece toda a stack, convenções e arquitetura..."
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-neutral-400">
          Arquivos de contexto fixos (um caminho absoluto por linha — ex: CLAUDE.md do projeto)
        </span>
        <textarea
          value={contextFiles}
          onChange={(e) => setContextFiles(e.target.value)}
          rows={3}
          placeholder={"/home/bruno/Workspace/Projects/scoder/CLAUDE.md"}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
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
        disabled={submitting}
        className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        {submitting ? "Criando…" : "Criar agente"}
      </button>
    </form>
  );
}
