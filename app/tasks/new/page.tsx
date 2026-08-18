import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { agentService } from "@/lib/services/agent.service";
import { TaskForm } from "@/components/task-form";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const agents = await agentService.list();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova tarefa</h1>
        <p className="text-neutral-400">
          Descreva o que o Claude deve fazer, escolha o agente e, se precisar, anexe arquivos.
        </p>
      </div>

      {agents.length === 0 ? (
        <p className="flex items-center gap-2 text-neutral-400">
          <TriangleAlert className="size-4 shrink-0 text-yellow-500" />
          Nenhum agente cadastrado ainda.{" "}
          <Link href="/agents" className="inline-flex items-center gap-1 text-orange-500 hover:underline">
            Crie um agente primeiro
            <ArrowRight className="size-3.5" />
          </Link>
        </p>
      ) : (
        <TaskForm agents={agents.map((a) => ({ id: a.id, name: a.name }))} />
      )}
    </div>
  );
}
