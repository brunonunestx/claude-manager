import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  systemPrompt: z.string().min(1, "System prompt é obrigatório"),
  cwd: z.string().min(1, "Diretório do projeto é obrigatório"),
  contextFiles: z.array(z.string()).default([]),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
