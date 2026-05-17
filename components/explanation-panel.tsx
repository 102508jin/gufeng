import type { VariantResult } from "@/lib/types/generation";
import { splitChineseSentences } from "@/lib/utils/text";

type ExplanationPanelProps = {
  variant: VariantResult;
};

const text = {
  title: "解释说明",
  literal: "逐句直解",
  free: "意译阐释",
  gloss: "词义注释",
  separator: "、"
} as const;

function isStandalonePunctuation(value: string): boolean {
  return /^[。；，、！？：]+$/u.test(value.trim());
}

export function ExplanationPanel({ variant }: ExplanationPanelProps) {
  const freeExplanationLines = variant.freeExplanation
    ? splitChineseSentences(variant.freeExplanation).filter((line) => !isStandalonePunctuation(line))
    : [];
  const sanitizedLinePairs = variant.lineByLinePairs.filter(
    (pair) => !isStandalonePunctuation(pair.classicalSegment) && !isStandalonePunctuation(pair.vernacularSegment)
  );

  return (
    <details className="stack-section collapsible-stack">
      <summary className="section-header collapsible-summary">
        <h4>{text.title}</h4>
      </summary>

      <div className="explanation-grid">
        {sanitizedLinePairs.length ? (
          <article className="subpanel explanation-panel-literal">
            <p className="subpanel-title">{text.literal}</p>
            <div className="literal-line-list">
              {sanitizedLinePairs.map((pair, index) => (
                <div key={`${pair.classicalSegment}-${index}`} className="literal-line-item">
                  <p className="literal-line-classical">{pair.classicalSegment}</p>
                  <p className="literal-line-vernacular">{pair.vernacularSegment}</p>
                  {pair.notes?.length ? <p className="line-pair-notes">{pair.notes.join(text.separator)}</p> : null}
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {variant.freeExplanation ? (
          <article className="subpanel explanation-panel-free">
            <p className="subpanel-title">{text.free}</p>
            <div className="free-paragraph-list">
              {(freeExplanationLines.length ? freeExplanationLines : [variant.freeExplanation]).map((line, index) => (
                <p key={`${line}-${index}`} className="free-paragraph">
                  {line}
                </p>
              ))}
            </div>
          </article>
        ) : null}

        {variant.glossExplanation ? (
          <article className="subpanel">
            <p className="subpanel-title">{text.gloss}</p>
            <p>{variant.glossExplanation}</p>
          </article>
        ) : null}
      </div>
    </details>
  );
}
