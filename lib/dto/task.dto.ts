import { z } from "zod";

export const createTaskSchema = z.object({
  agentId: z.string().min(1, "Selecione um agente"),
  prompt: z.string().min(1, "Descreva a tarefa"),
  extraContext: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
