import type { VariantResult } from "@/lib/types/generation";

type ExplanationPanelProps = {
  variant: VariantResult;
};

export function ExplanationPanel({ variant }: ExplanationPanelProps) {
  return (
    <section className="stack-section">
      <div className="section-header">
        <h4>Explanations</h4>
      </div>

      <div className="explanation-grid">
        {variant.literalExplanation ? (
          <article className="subpanel">
            <p className="subpanel-title">Literal</p>
            <p>{variant.literalExplanation}</p>
          </article>
        ) : null}

        {variant.freeExplanation ? (
          <article className="subpanel">
            <p className="subpanel-title">Free Explanation</p>
            <p>{variant.freeExplanation}</p>
          </article>
        ) : null}

        {variant.glossExplanation ? (
          <article className="subpanel">
            <p className="subpanel-title">Gloss</p>
            <p>{variant.glossExplanation}</p>
          </article>
        ) : null}
      </div>

      <div className="line-pair-list">
        {variant.lineByLinePairs.map((pair, index) => (
          <div key={`${pair.classicalSegment}-${index}`} className="line-pair-card">
            <p className="line-pair-classical">{pair.classicalSegment}</p>
            <p className="line-pair-vernacular">{pair.vernacularSegment}</p>
            {pair.notes?.length ? <p className="line-pair-notes">{pair.notes.join("; ")}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}