import { ExplanationPanel } from "@/components/explanation-panel";
import { SourcePanel } from "@/components/source-panel";
import type { RetrievedChunk } from "@/lib/types/retrieval";
import type { VariantResult } from "@/lib/types/generation";

type VariantCardProps = {
  variant: VariantResult;
  retrievalRefs: RetrievedChunk[];
};

export function VariantCard({ variant, retrievalRefs }: VariantCardProps) {
  return (
    <article className="panel variant-card">
      <div className="variant-header">
        <div>
          <p className="eyebrow">Variant</p>
          <h3>{variant.title}</h3>
        </div>
        {variant.styleNotes?.length ? <p className="style-note">{variant.styleNotes.join(" ")}</p> : null}
      </div>

      <blockquote className="classical-block">{variant.classicalText}</blockquote>
      <ExplanationPanel variant={variant} />
      <SourcePanel refs={variant.sources} retrievalRefs={retrievalRefs} />
    </article>
  );
}