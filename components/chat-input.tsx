import { PersonaSelector } from "@/components/persona-selector";
import type { ExplanationMode, InputMode } from "@/lib/types/generation";
import type { PersonaProfile } from "@/lib/types/persona";

type ChatInputProps = {
  query: string;
  inputMode: InputMode;
  variantsCount: number;
  explanationModes: ExplanationMode[];
  personaId: string;
  personas: PersonaProfile[];
  disabled?: boolean;
  onQueryChange: (value: string) => void;
  onInputModeChange: (value: InputMode) => void;
  onVariantsCountChange: (value: number) => void;
  onExplanationModesChange: (value: ExplanationMode[]) => void;
  onPersonaChange: (value: string) => void;
  onSubmit: () => void;
};

const text = {
  eyebrow: "\u8f93\u5165\u8bbe\u7f6e",
  title: "\u95ee\u7b54\u5de5\u4f5c\u53f0",
  summary: "\u5148\u6574\u7406\u95ee\u9898\uff0c\u518d\u751f\u6210\u6587\u8a00\u7b54\u590d\u4e0e\u89e3\u6790\u3002",
  queryLabel: "\u63d0\u95ee\u5185\u5bb9",
  placeholder: "\u4f8b\u5982\uff1a\u6211\u6700\u8fd1\u603b\u62d6\u5ef6\uff0c\u600e\u6837\u624d\u80fd\u771f\u6b63\u5f00\u59cb\u884c\u52a8\uff1f",
  modeLabel: "\u8f93\u5165\u65b9\u5f0f",
  auto: "\u81ea\u52a8\u8bc6\u522b",
  vernacular: "\u767d\u8bdd\u6587",
  classical: "\u6587\u8a00\u6587",
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

export function ChatInput(props: ChatInputProps) {
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
        />
      </label>

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

      <PersonaSelector personas={props.personas} value={props.personaId} onChange={props.onPersonaChange} />

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
    </section>
  );
}
