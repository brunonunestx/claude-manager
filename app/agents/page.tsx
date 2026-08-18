import { Plus, Bot, FolderGit2 } from "lucide-react";
import { agentService } from "@/lib/services/agent.service";
import { AgentForm } from "@/components/agent-form";
import { DeleteAgentButton } from "@/components/delete-agent-button";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await agentService.list();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Agentes</h1>
        <p className="text-neutral-400">
          Presets reutilizáveis: system prompt fixo, diretório do projeto e arquivos de contexto
          sempre carregados — ex: um agente “Scoder” com o conhecimento do projeto Scoder.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-1.5 text-lg font-medium">
          <Plus className="size-4" />
          Novo agente
        </h2>
        <AgentForm />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-1.5 text-lg font-medium">
          <Bot className="size-4" />
          Agentes existentes
        </h2>
        {agents.length === 0 ? (
          <p className="text-neutral-400">Nenhum agente criado ainda.</p>
        ) : (
          <ul className="divide-y divide-neutral-800 rounded-2xl border border-neutral-800">
            {agents.map((agent) => (
              <li key={agent.id} className="flex items-start justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-orange-500">
                    <Bot className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="flex items-center gap-1 text-sm text-neutral-400">
                      <FolderGit2 className="size-3.5" />
                      {agent.cwd}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{agent.systemPrompt}</p>
                  </div>
                </div>
                <DeleteAgentButton agentId={agent.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
