"use client";

import { useEffect, useState } from "react";

import { ChatInput } from "@/components/chat-input";
import { VariantCard } from "@/components/variant-card";
import { DEFAULT_EXPLANATION_MODES, DEFAULT_VARIANTS_COUNT } from "@/lib/config/constants";
import type { ApiResult } from "@/lib/types/api";
import type { ExplanationMode, GenerateResponse, InputMode } from "@/lib/types/generation";
import type { PersonaProfile } from "@/lib/types/persona";

const starterQuestion = "\u6700\u8fd1\u603b\u89c9\u5f97\u8ba1\u5212\u5f88\u591a\u5374\u603b\u62d6\u5ef6\uff0c\u5e94\u8be5\u600e\u6837\u7a33\u4f4f\u5fc3\u5fd7\u5e76\u771f\u6b63\u884c\u52a8\u8d77\u6765\uff1f";

export function Workspace() {
  const [query, setQuery] = useState(starterQuestion);
  const [inputMode, setInputMode] = useState<InputMode>("auto");
  const [variantsCount, setVariantsCount] = useState(DEFAULT_VARIANTS_COUNT);
  const [explanationModes, setExplanationModes] = useState<ExplanationMode[]>(DEFAULT_EXPLANATION_MODES);
  const [personaId, setPersonaId] = useState("");
  const [personas, setPersonas] = useState<PersonaProfile[]>([]);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPersonas() {
      try {
        const response = await fetch("/api/personas");
        const payload = (await response.json()) as ApiResult<PersonaProfile[]>;
        if (!cancelled && payload.ok) {
          setPersonas(payload.data);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load personas.");
        }
      }
    }

    void loadPersonas();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          inputMode,
          personaId: personaId || null,
          variantsCount,
          explanationModes
        })
      });

      const payload = (await response.json()) as ApiResult<GenerateResponse>;
      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setResult(payload.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Generation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">Wenyan Agent</p>
        <h1>Classical Chinese Answering Agent</h1>
        <p className="hero-copy">
          Normalize the user question first, then generate multiple classical variants with line-by-line and free explanations.
        </p>
      </section>

      <div className="workspace-grid">
        <ChatInput
          query={query}
          inputMode={inputMode}
          variantsCount={variantsCount}
          explanationModes={explanationModes}
          personaId={personaId}
          personas={personas}
          disabled={isSubmitting}
          onQueryChange={setQuery}
          onInputModeChange={setInputMode}
          onVariantsCountChange={setVariantsCount}
          onExplanationModesChange={setExplanationModes}
          onPersonaChange={setPersonaId}
          onSubmit={() => {
            void handleSubmit();
          }}
        />

        <section className="results-column">
          {error ? <div className="panel error-panel">{error}</div> : null}

          {result ? (
            <>
              <section className="panel summary-panel">
                <div className="summary-grid">
                  <article>
                    <p className="eyebrow">Normalized Query</p>
                    <h2>{result.normalizedQuery}</h2>
                  </article>
                  <article>
                    <p className="eyebrow">Detected Mode</p>
                    <p>{result.detectedInputMode === "classical" ? "Classical Chinese" : "Vernacular Chinese"}</p>
                  </article>
                  <article>
                    <p className="eyebrow">Provider</p>
                    <p>{result.debug?.provider ?? "unknown"}</p>
                  </article>
                  <article>
                    <p className="eyebrow">Persona</p>
                    <p>{result.persona?.name ?? "Generic classical voice"}</p>
                  </article>
                </div>
                {result.debug?.normalizationNotes?.length ? (
                  <p className="summary-notes">{result.debug.normalizationNotes.join(" | ")}</p>
                ) : null}
              </section>

              {result.variants.map((variant) => (
                <VariantCard key={variant.id} variant={variant} retrievalRefs={result.retrievalRefs} />
              ))}
            </>
          ) : (
            <section className="panel empty-panel">
              <p className="eyebrow">Preview</p>
              <h2>Enter a question to generate a classical response.</h2>
              <p>
                The default runtime uses a mock provider, so the end-to-end workflow still works before API keys are configured.
              </p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}