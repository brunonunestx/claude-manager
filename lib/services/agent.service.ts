import { prisma } from "@/lib/prisma";
import type { CreateAgentInput } from "@/lib/dto/agent.dto";

export const agentService = {
  list() {
    return prisma.agent.findMany({ orderBy: { createdAt: "desc" } });
  },

  get(id: string) {
    return prisma.agent.findUnique({ where: { id } });
  },

  create(input: CreateAgentInput) {
    return prisma.agent.create({
      data: {
        name: input.name,
        systemPrompt: input.systemPrompt,
        cwd: input.cwd,
        contextFiles: JSON.stringify(input.contextFiles ?? []),
      },
    });
  },

  remove(id: string) {
    return prisma.agent.delete({ where: { id } });
  },
};
