import { z } from "zod";

import {
  DEFAULT_AI_INTERVENTION,
  DEFAULT_EXPLANATION_MODES,
  DEFAULT_RETRIEVAL_MODE,
  DEFAULT_VARIANTS_COUNT,
  MAX_QUERY_LENGTH,
  MAX_VARIANTS_COUNT
} from "@/lib/config/constants";

export const generateRequestSchema = z.object({
  query: z.string().trim().min(1, "query is required").max(MAX_QUERY_LENGTH, "query is too long"),
  inputMode: z.enum(["auto", "vernacular", "classical"]).default("auto"),
  personaId: z.string().trim().min(1).nullable().optional(),
  providerId: z.string().trim().min(1).nullable().optional(),
  variantsCount: z.coerce.number().int().min(1).max(MAX_VARIANTS_COUNT).default(DEFAULT_VARIANTS_COUNT),
  explanationModes: z.array(z.enum(["literal", "free", "gloss"]))
    .min(1)
    .default(DEFAULT_EXPLANATION_MODES),
  aiIntervention: z.enum(["conservative", "balanced", "creative"]).default(DEFAULT_AI_INTERVENTION),
  retrievalMode: z.enum(["off", "focused", "auto", "broad"]).default(DEFAULT_RETRIEVAL_MODE),
  userContext: z.object({
    displayName: z.string().trim().max(40).optional(),
    useCase: z.string().trim().max(80).optional(),
    preference: z.string().trim().max(240).optional()
  }).nullable().optional()
});

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;
