import { z } from "zod";

import { DEFAULT_EXPLANATION_MODES, DEFAULT_VARIANTS_COUNT, MAX_VARIANTS_COUNT } from "@/lib/config/constants";

export const generateRequestSchema = z.object({
  query: z.string().trim().min(1, "query is required"),
  inputMode: z.enum(["auto", "vernacular", "classical"]).default("auto"),
  personaId: z.string().trim().min(1).nullable().optional(),
  variantsCount: z.coerce.number().int().min(1).max(MAX_VARIANTS_COUNT).default(DEFAULT_VARIANTS_COUNT),
  explanationModes: z.array(z.enum(["literal", "free", "gloss"]))
    .min(1)
    .default(DEFAULT_EXPLANATION_MODES)
});

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;