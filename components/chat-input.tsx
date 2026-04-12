import type { ExplanationMode, InputMode } from "@/lib/types/generation";
import type { PersonaProfile } from "@/lib/types/persona";
import { PersonaSelector } from "@/components/persona-selector";

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

const explanationOptions: Array<{ label: string; value: ExplanationMode }> = [
  { label: "Literal", value: "literal" },
  { label: "Free", value: "free" },
  { label: "Gloss", value: "gloss" }
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
          <p className="eyebrow">Input</p>
          <h2>Prompt Workspace</h2>
        </div>
        <p className="panel-copy">The request is normalized first, then rewritten into classical Chinese and paired with multiple explanations.</p>
      </div>

      <label className="field-group">
        <span className="field-label">Question</span>
        <textarea
          className="field-input field-textarea"
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder="Example: 我最近做事总是拖延，怎样才能坚持把计划执行下去？"
          disabled={props.disabled}
          rows={6}
        />
      </label>

      <div className="field-grid">
        <label className="field-group">
          <span className="field-label">Input Mode</span>
          <select
            className="field-input field-select"
            value={props.inputMode}
            onChange={(event) => props.onInputModeChange(event.target.value as InputMode)}
            disabled={props.disabled}
          >
            <option value="auto">Auto Detect</option>
            <option value="vernacular">Vernacular Chinese</option>
            <option value="classical">Classical Chinese</option>
          </select>
        </label>

        <label className="field-group">
          <span className="field-label">Variants</span>
          <select
            className="field-input field-select"
            value={String(props.variantsCount)}
            onChange={(event) => props.onVariantsCountChange(Number(event.target.value))}
            disabled={props.disabled}
          >
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
      </div>

      <PersonaSelector personas={props.personas} value={props.personaId} onChange={props.onPersonaChange} />

      <div className="field-group">
        <span className="field-label">Explanation Modes</span>
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

      <button type="button" className="primary-button" onClick={props.onSubmit} disabled={props.disabled || !props.query.trim()}>
        {props.disabled ? "Generating..." : "Generate Classical Response"}
      </button>
    </section>
  );
}