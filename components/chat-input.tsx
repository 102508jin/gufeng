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
  hasCustomProviderSettings: boolean;
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
  onOpenSettings: () => void;
  onKnowledgeSearch: () => void;
  onSubmit: () => void;
};

const text = {
  eyebrow: "\u73b0\u4ee3\u767d\u8bdd\u6587\u8f93\u5165",
  title: "\u73b0\u4ee3\u767d\u8bdd\u6587\u8f93\u5165",
  summary: "\u95ee\u9898\u3001\u98ce\u683c\u3001\u77e5\u8bc6\u5e93\u4e0e\u6a21\u578b\u914d\u7f6e",
  queryLabel: "\u73b0\u4ee3\u767d\u8bdd\u6587\u8f93\u5165",
  placeholder: "\u5728\u6b64\u8f93\u5165\u9700\u8981\u89e3\u6790\u6216\u8f6c\u6362\u7684\u95ee\u9898...",
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
  aiInterventionLabel: "AI \u6da6\u8272\u529b\u5ea6",
  conservative: "\u4e25\u8c28\u5f15\u7ecf",
  balanced: "\u5316\u7528\u878d\u5408",
  creative: "\u81ea\u7531\u521b\u4f5c",
  retrievalLabel: "\u5178\u7c4d\u68c0\u7d22",
  retrievalOff: "\u4e0d\u5f15\u5178",
  retrievalFocused: "\u4e25\u8c28\u5f15\u7ecf",
  retrievalAuto: "\u5316\u7528\u878d\u5408",
  retrievalBroad: "\u5e7f\u6cdb\u535a\u91c7",
  knowledgeSearch: "\u9884\u68c0\u5178\u7c4d",
  knowledgeSearching: "\u68c0\u7d22\u4e2d...",
  knowledgePreview: "\u547d\u4e2d\u6765\u6e90",
  sourceScore: "\u76f8\u5173\u5ea6",
  validationTitle: "\u8868\u5355\u63d0\u793a",
  profileSection: "\u4e2a\u4eba\u8bed\u5883",
  generationSection: "\u5206\u6790\u53c2\u6570\u914d\u7f6e",
  retrievalSection: "\u5178\u7c4d\u68c0\u7d22",
  modelSection: "\u4e8c\u7ea7\u8bbe\u7f6e",
  providerLabel: "\u670d\u52a1\u5546",
  providerDefault: "\u8ddf\u968f\u9ed8\u8ba4\u914d\u7f6e",
  providerNotReady: "\u672a\u914d\u7f6e",
  settings: "\u6a21\u578b\u8bbe\u7f6e",
  settingsCustom: "\u6a21\u578b\u8bbe\u7f6e\uff08\u5df2\u8986\u76d6\uff09",
  variantsLabel: "\u751f\u6210\u7248\u672c",
  explanationLabel: "\u89e3\u6790\u7c7b\u578b",
  generating: "\u751f\u6210\u4e2d...",
  submit: "\u751f\u6210",
  strictDescription: "\u4ec5\u5f15\u7528\u5df2\u6821\u9a8c\u5178\u7c4d\u7684\u539f\u53e5\u3002",
  balancedDescription: "\u57fa\u4e8e\u7ecf\u5178\u98ce\u683c\u5316\u7528\u8f9e\u85fb\u3002",
  creativeDescription: "\u5bbd\u6cdb\u542f\u53d1\uff0c\u8f83\u81ea\u7531\u3002",
  advancedSettings: "\u9ad8\u7ea7\u8bbe\u7f6e"
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
      <header className="composer-header">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
        </div>
      </header>

      <div className="composer-body">
        <div className="prompt-box stitch-prompt-box">
          <label className="field-label" htmlFor="query-input">{text.queryLabel}</label>
          <textarea
            id="query-input"
            className="field-input prompt-textarea"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={text.placeholder}
            disabled={props.disabled}
            rows={4}
            maxLength={1000}
          />
          <div className="prompt-action-row">
            <span>{`${props.query.length} / 1000`}</span>
            <button
              type="button"
              className="primary-button compact-button"
              onClick={props.onSubmit}
              disabled={props.disabled || !props.query.trim()}
            >
              {props.disabled ? text.generating : text.submit}
            </button>
          </div>
        </div>

        <div className="composer-section">
          <div className="section-title-row">
            <p className="field-label">{text.generationSection}</p>
          </div>
          <PersonaSelector
            personas={props.personas}
            value={props.personaId}
            disabled={props.disabled}
            onChange={props.onPersonaChange}
          />
          <div className="compact-field">
            <span>释义深度</span>
            <div className="chip-row segmented-row">
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
                    {option.label.replace("逐句", "").replace("阐释", "").replace("注释", "")}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="compact-field ai-strength-field">
            <div className="section-title-row">
              <span>{text.aiInterventionLabel}</span>
              <span className="range-value">{props.aiIntervention === "creative" ? "高" : props.aiIntervention === "conservative" ? "低" : "适中"}</span>
            </div>
            <div className="stitch-range" aria-hidden="true">
              <span className={`stitch-range-fill stitch-range-${props.aiIntervention}`} />
              <span className={`stitch-range-thumb stitch-range-thumb-${props.aiIntervention}`} />
            </div>
            <div className="range-scale"><span>低</span><span>高</span></div>
          </div>

          <div className="retrieval-mode-list">
            {aiInterventionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`retrieval-mode-option ${props.aiIntervention === option.value ? "retrieval-mode-option-active" : ""}`}
                onClick={() => props.onAiInterventionChange(option.value)}
                disabled={props.disabled}
              >
                <span className="radio-dot" aria-hidden="true" />
                <strong>{option.label}</strong>
                <small>
                  {option.value === "conservative"
                    ? text.strictDescription
                    : option.value === "creative"
                      ? text.creativeDescription
                      : text.balancedDescription}
                </small>
              </button>
            ))}
          </div>
        </div>

        <div className="composer-section">
          <div className="section-title-row">
            <p className="field-label">{text.retrievalSection}</p>
            <button
              type="button"
              className="ghost-button"
              onClick={props.onKnowledgeSearch}
              disabled={props.disabled || props.knowledgeSearching || !props.query.trim()}
            >
              {props.knowledgeSearching ? text.knowledgeSearching : text.knowledgeSearch}
            </button>
          </div>
          <div className="retrieval-mode-list">
            {retrievalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`retrieval-mode-option ${props.retrievalMode === option.value ? "retrieval-mode-option-active" : ""}`}
                onClick={() => props.onRetrievalModeChange(option.value)}
                disabled={props.disabled}
              >
                <span className="radio-dot" aria-hidden="true" />
                <strong>{option.label}</strong>
                <small>{option.value === "off" ? "不使用知识库来源。" : option.value === "focused" ? "优先少量高相关片段。" : option.value === "broad" ? "放宽范围，召回更多资料。" : "自动平衡相关性与覆盖面。"}</small>
              </button>
            ))}
          </div>
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

        <details className="composer-section advanced-settings">
          <summary>{text.advancedSettings}</summary>
          <div className="field-grid">
            <label className="compact-field">
              <span>{text.modeLabel}</span>
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
            <label className="compact-field">
              <span>{text.variantsLabel}</span>
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
          <label className="compact-field">
            <span>{text.providerLabel}</span>
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
        </details>

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
      </div>
    </section>
  );
}
