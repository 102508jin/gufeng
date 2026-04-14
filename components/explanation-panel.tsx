import type { VariantResult } from "@/lib/types/generation";

type ExplanationPanelProps = {
  variant: VariantResult;
};

const text = {
  title: "\u89e3\u6790\u8bf4\u660e",
  literal: "\u9010\u53e5\u76f4\u89e3",
  free: "\u610f\u8bd1\u9610\u91ca",
  gloss: "\u8bcd\u4e49\u6ce8\u91ca",
  separator: "\u3001"
} as const;

export function ExplanationPanel({ variant }: ExplanationPanelProps) {
  return (
    <section className="stack-section">
      <div className="section-header">
        <h4>{text.title}</h4>
      </div>

      <div className="explanation-grid">
        {variant.literalExplanation ? (
          <article className="subpanel">
            <p className="subpanel-title">{text.literal}</p>
            <p>{variant.literalExplanation}</p>
          </article>
        ) : null}

        {variant.freeExplanation ? (
          <article className="subpanel">
            <p className="subpanel-title">{text.free}</p>
            <p>{variant.freeExplanation}</p>
          </article>
        ) : null}

        {variant.glossExplanation ? (
          <article className="subpanel">
            <p className="subpanel-title">{text.gloss}</p>
            <p>{variant.glossExplanation}</p>
          </article>
        ) : null}
      </div>

      <div className="line-pair-list">
        {variant.lineByLinePairs.map((pair, index) => (
          <div key={`${pair.classicalSegment}-${index}`} className="line-pair-card">
            <p className="line-pair-classical">{pair.classicalSegment}</p>
            <p className="line-pair-vernacular">{pair.vernacularSegment}</p>
            {pair.notes?.length ? <p className="line-pair-notes">{pair.notes.join(text.separator)}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
