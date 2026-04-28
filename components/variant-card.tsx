import { ExplanationPanel } from "@/components/explanation-panel";
import { SourcePanel } from "@/components/source-panel";
import type { VariantResult } from "@/lib/types/generation";
import type { RetrievedChunk } from "@/lib/types/retrieval";

type VariantCardProps = {
  variant: VariantResult;
  retrievalRefs: RetrievedChunk[];
  isFavorite?: boolean;
  onCopyClassical: (variant: VariantResult) => void;
  onCopyExplanation: (variant: VariantResult) => void;
  onCopySources: (variant: VariantResult) => void;
  onToggleFavorite: (variant: VariantResult) => void;
};

const eyebrow = "\u7b54\u590d\u7248\u672c";
const noteSeparator = "\u3001";
const text = {
  copyClassical: "\u590d\u5236\u6587\u8a00",
  copyExplanation: "\u590d\u5236\u89e3\u91ca",
  copySources: "\u590d\u5236\u6765\u6e90",
  favorite: "\u6536\u85cf",
  favorited: "\u5df2\u6536\u85cf"
} as const;

export function VariantCard({
  variant,
  retrievalRefs,
  isFavorite,
  onCopyClassical,
  onCopyExplanation,
  onCopySources,
  onToggleFavorite
}: VariantCardProps) {
  return (
    <article className="panel variant-card">
      <div className="variant-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{variant.title}</h3>
        </div>
        {variant.styleNotes?.length ? <p className="style-note">{variant.styleNotes.join(noteSeparator)}</p> : null}
      </div>

      <div className="variant-actions">
        <button type="button" className="small-button" onClick={() => onCopyClassical(variant)}>
          {text.copyClassical}
        </button>
        <button type="button" className="small-button" onClick={() => onCopyExplanation(variant)}>
          {text.copyExplanation}
        </button>
        <button type="button" className="small-button" onClick={() => onCopySources(variant)}>
          {text.copySources}
        </button>
        <button
          type="button"
          className={`small-button ${isFavorite ? "small-button-active" : ""}`}
          onClick={() => onToggleFavorite(variant)}
        >
          {isFavorite ? text.favorited : text.favorite}
        </button>
      </div>

      <blockquote className="classical-block">{variant.classicalText}</blockquote>
      <ExplanationPanel variant={variant} />
      <SourcePanel refs={variant.sources} retrievalRefs={retrievalRefs} />
    </article>
  );
}
