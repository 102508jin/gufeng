"use client";

import { useEffect, useState } from "react";

import { ChatInput } from "@/components/chat-input";
import { VariantCard } from "@/components/variant-card";
import { DEFAULT_EXPLANATION_MODES, DEFAULT_VARIANTS_COUNT } from "@/lib/config/constants";
import type { ApiResult } from "@/lib/types/api";
import type { ExplanationMode, GenerateResponse, InputMode } from "@/lib/types/generation";
import type { PersonaProfile } from "@/lib/types/persona";
import type { PublicModelProfile } from "@/lib/types/provider";

const starterQuestion =
  "\u6700\u8fd1\u603b\u89c9\u5f97\u8ba1\u5212\u5f88\u591a\u5374\u603b\u62d6\u5ef6\uff0c\u5e94\u8be5\u600e\u6837\u7a33\u4f4f\u5fc3\u5fd7\u5e76\u771f\u6b63\u884c\u52a8\u8d77\u6765\uff1f";

const text = {
  providerOllama: "\u672c\u5730 Ollama",
  providerOpenai: "OpenAI \u63a5\u53e3",
  providerAnthropic: "Claude / Anthropic",
  providerMock: "\u6f14\u793a\u6a21\u5f0f",
  providerUnknown: "\u672a\u77e5",
  loadPersonasFailed: "\u89d2\u8272\u5217\u8868\u52a0\u8f7d\u5931\u8d25\u3002",
  loadProvidersFailed: "\u6a21\u578b\u9a71\u52a8\u5217\u8868\u52a0\u8f7d\u5931\u8d25\u3002",
  generationFailed: "\u751f\u6210\u5931\u8d25\u3002",
  heroEyebrow: "\u53e4\u98ce\u95ee\u7b54",
  heroTitle: "\u6587\u8a00\u6587\u56de\u7b54\u667a\u80fd\u4f53",
  heroCopy: "\u652f\u6301\u767d\u8bdd\u4e0e\u6587\u8a00\u8f93\u5165\uff0c\u751f\u6210\u591a\u7248\u6587\u8a00\u7b54\u590d\u548c\u89e3\u6790\u3002",
  normalizedQuery: "\u5f52\u4e00\u5316\u95ee\u9898",
  detectedMode: "\u8bc6\u522b\u8f93\u5165",
  provider: "\u6a21\u578b\u63d0\u4f9b\u65b9",
  persona: "\u5f53\u524d\u89d2\u8272",
  classical: "\u6587\u8a00\u6587",
  vernacular: "\u767d\u8bdd\u6587",
  genericPersona: "\u901a\u7528\u6587\u8a00\u8bed\u6c14",
  previewEyebrow: "\u7ed3\u679c\u9884\u89c8",
  previewTitle: "\u8f93\u5165\u95ee\u9898\u540e\u5373\u53ef\u751f\u6210\u6587\u8a00\u7b54\u590d\u3002",
  previewCopy: "\u8f93\u5165\u95ee\u9898\u540e\u5373\u53ef\u751f\u6210\u6587\u8a00\u7b54\u590d\uff0c\u5e76\u67e5\u770b\u9010\u53e5\u89e3\u6790\u4e0e\u53c2\u8003\u6765\u6e90\u3002",
  notesSeparator: "\u3001"
} as const;

const providerLabels: Record<string, string> = {
  ollama: text.providerOllama,
  openai: text.providerOpenai,
  "openai-compatible": text.providerOpenai,
  anthropic: text.providerAnthropic,
  mock: text.providerMock,
  [text.providerOllama]: text.providerOllama,
  [text.providerOpenai]: text.providerOpenai,
  [text.providerAnthropic]: text.providerAnthropic,
  [text.providerMock]: text.providerMock
};

function formatProvider(provider?: string) {
  if (!provider) {
    return text.providerUnknown;
  }

  return providerLabels[provider] ?? provider;
}

export function Workspace() {
  const [query, setQuery] = useState(starterQuestion);
  const [inputMode, setInputMode] = useState<InputMode>("auto");
  const [variantsCount, setVariantsCount] = useState(DEFAULT_VARIANTS_COUNT);
  const [explanationModes, setExplanationModes] = useState<ExplanationMode[]>(DEFAULT_EXPLANATION_MODES);
  const [personaId, setPersonaId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [personas, setPersonas] = useState<PersonaProfile[]>([]);
  const [providers, setProviders] = useState<PublicModelProfile[]>([]);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [personaResponse, providerResponse] = await Promise.all([
          fetch("/api/personas"),
          fetch("/api/providers")
        ]);
        const personaPayload = (await personaResponse.json()) as ApiResult<PersonaProfile[]>;
        const providerPayload = (await providerResponse.json()) as ApiResult<PublicModelProfile[]>;

        if (!personaPayload.ok) {
          throw new Error(personaPayload.error || text.loadPersonasFailed);
        }

        if (!providerPayload.ok) {
          throw new Error(providerPayload.error || text.loadProvidersFailed);
        }

        if (!cancelled) {
          setPersonas(personaPayload.data);
          setProviders(providerPayload.data);

          const defaultProvider = providerPayload.data.find((provider) => provider.isDefault && provider.configured)
            ?? providerPayload.data.find((provider) => provider.configured);

          if (defaultProvider) {
            setProviderId(defaultProvider.id);
          }
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : text.loadProvidersFailed);
        }
      }
    }

    void loadInitialData();
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
          providerId: providerId || null,
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
      setError(cause instanceof Error ? cause.message : text.generationFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">{text.heroEyebrow}</p>
        <h1>{text.heroTitle}</h1>
        <p className="hero-copy">{text.heroCopy}</p>
      </section>

      <div className="workspace-grid">
        <ChatInput
          query={query}
          inputMode={inputMode}
          variantsCount={variantsCount}
          explanationModes={explanationModes}
          personaId={personaId}
          providerId={providerId}
          personas={personas}
          providers={providers}
          disabled={isSubmitting}
          onQueryChange={setQuery}
          onInputModeChange={setInputMode}
          onVariantsCountChange={setVariantsCount}
          onExplanationModesChange={setExplanationModes}
          onPersonaChange={setPersonaId}
          onProviderChange={setProviderId}
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
                    <p className="eyebrow">{text.normalizedQuery}</p>
                    <h2>{result.normalizedQuery}</h2>
                  </article>
                  <article>
                    <p className="eyebrow">{text.detectedMode}</p>
                    <p>{result.detectedInputMode === "classical" ? text.classical : text.vernacular}</p>
                  </article>
                  <article>
                    <p className="eyebrow">{text.provider}</p>
                    <p>{formatProvider(result.debug?.provider)}</p>
                  </article>
                  <article>
                    <p className="eyebrow">{text.persona}</p>
                    <p>{result.persona?.name ?? text.genericPersona}</p>
                  </article>
                </div>
                {result.debug?.normalizationNotes?.length ? (
                  <p className="summary-notes">{result.debug.normalizationNotes.join(text.notesSeparator)}</p>
                ) : null}
              </section>

              {result.variants.map((variant) => (
                <VariantCard key={variant.id} variant={variant} retrievalRefs={result.retrievalRefs} />
              ))}
            </>
          ) : (
            <section className="panel empty-panel">
              <p className="eyebrow">{text.previewEyebrow}</p>
              <h2>{text.previewTitle}</h2>
              <p>{text.previewCopy}</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
