import { notFound } from "next/navigation";
import { Bot } from "lucide-react";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { taskService } from "@/lib/services/task.service";
import { TaskConversation } from "@/components/task-conversation";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await taskService.get(id);
  if (!task) notFound();

  const sessions = task.sessions.map((session) => ({
    id: session.id,
    userMessage: session.userMessage,
    status: session.status,
    transcript: JSON.parse(session.transcript) as SDKMessage[],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Bot className="size-6 text-orange-500" />
          {task.agent.name}
        </h1>
        <p className="text-neutral-400">{task.prompt}</p>
      </div>
      <TaskConversation taskId={id} sessions={sessions} />
    </div>
  );
}
