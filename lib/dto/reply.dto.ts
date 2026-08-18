import { z } from "zod";

export const replySchema = z.object({
  message: z.string().min(1, "Escreva uma mensagem"),
});

export type ReplyInput = z.infer<typeof replySchema>;
