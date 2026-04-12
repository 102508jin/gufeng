import type { PersonaProfile } from "@/lib/types/persona";

type PersonaSelectorProps = {
  personas: PersonaProfile[];
  value: string;
  onChange: (value: string) => void;
};

export function PersonaSelector({ personas, value, onChange }: PersonaSelectorProps) {
  return (
    <label className="field-group">
      <span className="field-label">Persona Style</span>
      <select className="field-input field-select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Generic Classical Tone</option>
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.name} · {persona.dynasty ?? "Unknown era"}
          </option>
        ))}
      </select>
    </label>
  );
}