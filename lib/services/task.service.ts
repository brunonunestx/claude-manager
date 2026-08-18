import { prisma } from "@/lib/prisma";
import type { CreateTaskInput } from "@/lib/dto/task.dto";
import { startSession } from "@/lib/claude/runner";
import { buildInitialPrompt } from "@/lib/claude/prompt";

const ACTIVE_STATUSES = ["queued", "running"];

export const taskService = {
  list() {
    return prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        agent: true,
        sessions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  },

  get(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        agent: true,
        sessions: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  async createAndRun(input: CreateTaskInput) {
    const agent = await prisma.agent.findUniqueOrThrow({ where: { id: input.agentId } });
    const contextFiles: string[] = JSON.parse(agent.contextFiles || "[]");

    const task = await prisma.task.create({
      data: {
        agentId: input.agentId,
        prompt: input.prompt,
        extraContext: input.extraContext,
        attachments: JSON.stringify(input.attachments ?? []),
      },
    });

    const userMessage = buildInitialPrompt({
      taskPrompt: input.prompt,
      extraContext: input.extraContext,
      contextFiles,
      attachments: input.attachments ?? [],
    });

    const session = await prisma.session.create({
      data: { taskId: task.id, userMessage },
    });

    // Fires the subprocess in the background; the caller gets the session id
    // right away and follows progress via SSE / polling.
    startSession(session.id).catch((err) => {
      console.error(`session ${session.id} failed to start`, err);
    });

    return { task, session };
  },

  async reply(taskId: string, message: string) {
    const latest = await prisma.session.findFirst({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      throw new Error("Tarefa ainda não tem nenhuma sessão para continuar.");
    }

    if (ACTIVE_STATUSES.includes(latest.status)) {
      throw new Error("Já existe uma sessão em andamento para esta tarefa.");
    }

    const session = await prisma.session.create({
      data: { taskId, userMessage: message },
    });

    startSession(session.id).catch((err) => {
      console.error(`session ${session.id} failed to start`, err);
    });

    return session;
  },
};
