import { PersonaSelector } from "@/components/persona-selector";
import type {
  AiInterventionMode,
  ExplanationMode,
  InputMode,
  RetrievalMode,
  UserContext
} from "@/lib/types/generation";
import type { PersonaProfile } from "@/lib/types/persona";
import type { PublicModelProfile } from "@/lib/types/provider";
import type { SourceRef } from "@/lib/types/retrieval";

type ChatInputProps = {
  query: string;
  inputMode: InputMode;
  variantsCount: number;
  explanationModes: ExplanationMode[];
  aiIntervention: AiInterventionMode;
  retrievalMode: RetrievalMode;
  userContext: UserContext;
  personaId: string;
  providerId: string;
  personas: PersonaProfile[];
  providers: PublicModelProfile[];
  knowledgeRefs: SourceRef[];
  knowledgeError: string | null;
  knowledgeSearching: boolean;
  validationMessages: string[];
  disabled?: boolean;
  onQueryChange: (value: string) => void;
  onInputModeChange: (value: InputMode) => void;
  onVariantsCountChange: (value: number) => void;
  onExplanationModesChange: (value: ExplanationMode[]) => void;
  onAiInterventionChange: (value: AiInterventionMode) => void;
  onRetrievalModeChange: (value: RetrievalMode) => void;
  onUserContextChange: (value: UserContext) => void;
  onPersonaChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onKnowledgeSearch: () => void;
  onSubmit: () => void;
};

const text = {
  eyebrow: "\u8f93\u5165\u8bbe\u7f6e",
  title: "\u95ee\u7b54\u5de5\u4f5c\u53f0",
  summary: "\u95ee\u9898\u3001\u98ce\u683c\u3001\u77e5\u8bc6\u5e93\u4e0e\u6a21\u578b\u914d\u7f6e",
  queryLabel: "\u63d0\u95ee\u5185\u5bb9",
  placeholder: "\u4f8b\u5982\uff1a\u6211\u6700\u8fd1\u603b\u62d6\u5ef6\uff0c\u600e\u6837\u624d\u80fd\u771f\u6b63\u5f00\u59cb\u884c\u52a8\uff1f",
  userLabel: "\u672c\u5730\u7528\u6237",
  displayNameLabel: "\u79f0\u547c",
  displayNamePlaceholder: "\u4f8b\u5982\uff1a\u6c88\u4e00",
  useCaseLabel: "\u7528\u9014",
  useCasePlaceholder: "\u4f8b\u5982\uff1a\u8bfe\u5802\u8bb2\u89e3",
  preferenceLabel: "\u504f\u597d",
  preferencePlaceholder: "\u4f8b\u5982\uff1a\u7b80\u6d01\uff0c\u5148\u7ed9\u53ef\u6267\u884c\u5efa\u8bae",
  modeLabel: "\u8f93\u5165\u65b9\u5f0f",
  auto: "\u81ea\u52a8\u8bc6\u522b",
  vernacular: "\u767d\u8bdd\u6587",
  classical: "\u6587\u8a00\u6587",
  aiInterventionLabel: "AI \u4ecb\u5165",
  conservative: "\u7a33\u59a5",
  balanced: "\u5e73\u8861",
  creative: "\u521b\u4f5c",
  retrievalLabel: "\u77e5\u8bc6\u5e93",
  retrievalOff: "\u5173\u95ed",
  retrievalFocused: "\u7cbe\u51c6",
  retrievalAuto: "\u6807\u51c6",
  retrievalBroad: "\u5e7f\u641c",
  knowledgeSearch: "\u9884\u68c0\u77e5\u8bc6\u5e93",
  knowledgeSearching: "\u68c0\u7d22\u4e2d...",
  knowledgePreview: "\u547d\u4e2d\u6765\u6e90",
  sourceScore: "\u76f8\u5173\u5ea6",
  validationTitle: "\u8868\u5355\u63d0\u793a",
  providerLabel: "\u6a21\u578b\u9a71\u52a8",
  providerDefault: "\u8ddf\u968f\u9ed8\u8ba4\u914d\u7f6e",
  providerNotReady: "\u672a\u914d\u7f6e",
  variantsLabel: "\u751f\u6210\u7248\u672c",
  explanationLabel: "\u89e3\u6790\u7c7b\u578b",
  generating: "\u751f\u6210\u4e2d...",
  submit: "\u751f\u6210\u6587\u8a00\u7b54\u590d"
} as const;

const explanationOptions: Array<{ label: string; value: ExplanationMode }> = [
  { label: "\u9010\u53e5\u76f4\u89e3", value: "literal" },
  { label: "\u610f\u8bd1\u9610\u91ca", value: "free" },
  { label: "\u8bcd\u4e49\u6ce8\u91ca", value: "gloss" }
];

const aiInterventionOptions: Array<{ label: string; value: AiInterventionMode }> = [
  { label: text.conservative, value: "conservative" },
  { label: text.balanced, value: "balanced" },
  { label: text.creative, value: "creative" }
];

const retrievalOptions: Array<{ label: string; value: RetrievalMode }> = [
  { label: text.retrievalOff, value: "off" },
  { label: text.retrievalFocused, value: "focused" },
  { label: text.retrievalAuto, value: "auto" },
  { label: text.retrievalBroad, value: "broad" }
];

export function ChatInput(props: ChatInputProps) {
  const updateUserContext = (patch: Partial<UserContext>) => {
    props.onUserContextChange({
      ...props.userContext,
      ...patch
    });
  };

  const toggleExplanationMode = (mode: ExplanationMode) => {
    const exists = props.explanationModes.includes(mode);
    if (exists && props.explanationModes.length === 1) {
      return;
    }

    props.onExplanationModesChange(
      exists ? props.explanationModes.filter((item) => item !== mode) : [...props.explanationModes, mode]
    );
  };

  return (
    <section className="panel composer-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
        </div>
        <p className="panel-copy">{text.summary}</p>
      </div>

      <label className="field-group">
        <span className="field-label">{text.queryLabel}</span>
        <textarea
          className="field-input field-textarea"
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder={text.placeholder}
          disabled={props.disabled}
          rows={6}
          maxLength={1000}
        />
      </label>

      <div className="field-group">
        <span className="field-label">{text.userLabel}</span>
        <div className="field-grid">
          <label className="compact-field">
            <span>{text.displayNameLabel}</span>
            <input
              className="field-input"
              value={props.userContext.displayName ?? ""}
              onChange={(event) => updateUserContext({ displayName: event.target.value })}
              placeholder={text.displayNamePlaceholder}
              disabled={props.disabled}
              maxLength={40}
            />
          </label>
          <label className="compact-field">
            <span>{text.useCaseLabel}</span>
            <input
              className="field-input"
              value={props.userContext.useCase ?? ""}
              onChange={(event) => updateUserContext({ useCase: event.target.value })}
              placeholder={text.useCasePlaceholder}
              disabled={props.disabled}
              maxLength={80}
            />
          </label>
        </div>
        <label className="compact-field">
          <span>{text.preferenceLabel}</span>
          <input
            className="field-input"
            value={props.userContext.preference ?? ""}
            onChange={(event) => updateUserContext({ preference: event.target.value })}
            placeholder={text.preferencePlaceholder}
            disabled={props.disabled}
            maxLength={240}
          />
        </label>
      </div>

      <div className="field-grid">
        <label className="field-group">
          <span className="field-label">{text.modeLabel}</span>
          <select
            className="field-input field-select"
            value={props.inputMode}
            onChange={(event) => props.onInputModeChange(event.target.value as InputMode)}
            disabled={props.disabled}
          >
            <option value="auto">{text.auto}</option>
            <option value="vernacular">{text.vernacular}</option>
            <option value="classical">{text.classical}</option>
          </select>
        </label>

        <label className="field-group">
          <span className="field-label">{text.variantsLabel}</span>
          <select
            className="field-input field-select"
            value={String(props.variantsCount)}
            onChange={(event) => props.onVariantsCountChange(Number(event.target.value))}
            disabled={props.disabled}
          >
            <option value="2">{`2 \u7248`}</option>
            <option value="3">{`3 \u7248`}</option>
            <option value="4">{`4 \u7248`}</option>
          </select>
        </label>
      </div>

      <div className="field-grid">
        <div className="field-group">
          <span className="field-label">{text.aiInterventionLabel}</span>
          <div className="chip-row segmented-row">
            {aiInterventionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip ${props.aiIntervention === option.value ? "chip-active" : ""}`}
                onClick={() => props.onAiInterventionChange(option.value)}
                disabled={props.disabled}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <span className="field-label">{text.retrievalLabel}</span>
          <div className="chip-row segmented-row">
            {retrievalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip ${props.retrievalMode === option.value ? "chip-active" : ""}`}
                onClick={() => props.onRetrievalModeChange(option.value)}
                disabled={props.disabled}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <PersonaSelector
        personas={props.personas}
        value={props.personaId}
        disabled={props.disabled}
        onChange={props.onPersonaChange}
      />

      <label className="field-group">
        <span className="field-label">{text.providerLabel}</span>
        <select
          className="field-input field-select"
          value={props.providerId}
          onChange={(event) => props.onProviderChange(event.target.value)}
          disabled={props.disabled}
        >
          <option value="">{text.providerDefault}</option>
          {props.providers.map((provider) => (
            <option key={provider.id} value={provider.id} disabled={!provider.configured}>
              {provider.label}
              {provider.configured ? "" : `\uff08${text.providerNotReady}\uff09`}
            </option>
          ))}
        </select>
      </label>

      <div className="knowledge-tools">
        <button
          type="button"
          className="secondary-button"
          onClick={props.onKnowledgeSearch}
          disabled={props.disabled || props.knowledgeSearching || !props.query.trim()}
        >
          {props.knowledgeSearching ? text.knowledgeSearching : text.knowledgeSearch}
        </button>
        {props.knowledgeError ? <p className="inline-error">{props.knowledgeError}</p> : null}
        {props.knowledgeRefs.length ? (
          <div className="knowledge-preview">
            <p className="field-label">{text.knowledgePreview}</p>
            <div className="knowledge-preview-list">
              {props.knowledgeRefs.map((refItem) => (
                <article key={refItem.id} className="knowledge-preview-item">
                  <div>
                    <h3>{refItem.title}</h3>
                    <p>{refItem.excerpt}</p>
                  </div>
                  <span>{`${text.sourceScore} ${refItem.score.toFixed(2)}`}</span>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="field-group">
        <span className="field-label">{text.explanationLabel}</span>
        <div className="chip-row">
          {explanationOptions.map((option) => {
            const active = props.explanationModes.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={`chip ${active ? "chip-active" : ""}`}
                onClick={() => toggleExplanationMode(option.value)}
                disabled={props.disabled}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={props.onSubmit}
        disabled={props.disabled || !props.query.trim()}
      >
        {props.disabled ? text.generating : text.submit}
      </button>

      {props.validationMessages.length ? (
        <div className="validation-panel" role="status">
          <p>{text.validationTitle}</p>
          <ul>
            {props.validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
