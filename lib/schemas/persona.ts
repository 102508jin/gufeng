import { z } from "zod";

export const personaIdSchema = z.object({
  personaId: z.string().trim().min(1)
});