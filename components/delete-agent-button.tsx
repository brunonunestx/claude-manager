"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteAgentButton({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Remover este agente? Tarefas/sessões associadas também serão apagadas.")) return;
    setBusy(true);
    await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      title="Remover agente"
      aria-label="Remover agente"
      className="shrink-0 rounded-lg p-2 text-red-400 hover:bg-red-950 hover:text-red-300 disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
