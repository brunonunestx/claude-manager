import { prisma } from "@/lib/prisma";

export const sessionService = {
  get(id: string) {
    return prisma.session.findUnique({
      where: { id },
      include: { task: { include: { agent: true } } },
    });
  },
};
