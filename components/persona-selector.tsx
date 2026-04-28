import type { PersonaProfile } from "@/lib/types/persona";

type PersonaSelectorProps = {
  personas: PersonaProfile[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const text = {
  label: "\u89d2\u8272\u98ce\u683c",
  fallback: "\u901a\u7528\u6587\u8a00\u8bed\u6c14",
  unknownEra: "\u65f6\u4ee3\u672a\u8be6"
} as const;

export function PersonaSelector({ personas, value, disabled, onChange }: PersonaSelectorProps) {
  return (
    <label className="field-group">
      <span className="field-label">{text.label}</span>
      <select
        className="field-input field-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">{text.fallback}</option>
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.name} {"\u00b7"} {persona.dynasty ?? text.unknownEra}
          </option>
        ))}
      </select>
    </label>
  );
}
