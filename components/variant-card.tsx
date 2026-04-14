import { ExplanationPanel } from "@/components/explanation-panel";
import { SourcePanel } from "@/components/source-panel";
import type { VariantResult } from "@/lib/types/generation";
import type { RetrievedChunk } from "@/lib/types/retrieval";

type VariantCardProps = {
  variant: VariantResult;
  retrievalRefs: RetrievedChunk[];
};

const eyebrow = "\u7b54\u590d\u7248\u672c";
const noteSeparator = "\u3001";

export function VariantCard({ variant, retrievalRefs }: VariantCardProps) {
  return (
    <article className="panel variant-card">
      <div className="variant-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{variant.title}</h3>
        </div>
        {variant.styleNotes?.length ? <p className="style-note">{variant.styleNotes.join(noteSeparator)}</p> : null}
      </div>

      <blockquote className="classical-block">{variant.classicalText}</blockquote>
      <ExplanationPanel variant={variant} />
      <SourcePanel refs={variant.sources} retrievalRefs={retrievalRefs} />
    </article>
  );
}
