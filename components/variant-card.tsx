import { ExplanationPanel } from "@/components/explanation-panel";
import { SourcePanel } from "@/components/source-panel";
import type { VariantResult } from "@/lib/types/generation";
import type { RetrievedChunk } from "@/lib/types/retrieval";
import type { FeedbackRating } from "@/lib/utils/workspace-memory";

type VariantCardProps = {
  variant: VariantResult;
  retrievalRefs: RetrievedChunk[];
  isFavorite?: boolean;
  onCopyClassical: (variant: VariantResult) => void;
  onCopyExplanation: (variant: VariantResult) => void;
  onCopySources: (variant: VariantResult) => void;
  onToggleFavorite: (variant: VariantResult) => void;
  feedbackRating?: FeedbackRating;
  onSubmitFeedback: (variant: VariantResult, rating: FeedbackRating) => void;
};

const eyebrow = "\u7b54\u590d\u7248\u672c";
const noteSeparator = "\u3001";
const text = {
  copyClassical: "\u590d\u5236\u6587\u8a00",
  copyExplanation: "\u590d\u5236\u89e3\u91ca",
  copySources: "\u590d\u5236\u6765\u6e90",
  favorite: "\u6536\u85cf",
  favorited: "\u5df2\u6536\u85cf",
  feedbackTitle: "\u8fd9\u4e2a\u56de\u7b54\u5bf9\u4f60\u6709\u7528\u5417\uff1f",
  useful: "\u6709\u7528",
  inaccurate: "\u4e0d\u51c6",
  tooLong: "\u592a\u957f",
  tooClassical: "\u592a\u6587"
} as const;

const feedbackOptions: Array<{ value: FeedbackRating; label: string }> = [
  { value: "useful", label: text.useful },
  { value: "inaccurate", label: text.inaccurate },
  { value: "too-long", label: text.tooLong },
  { value: "too-classical", label: text.tooClassical }
];

export function VariantCard({
  variant,
  retrievalRefs,
  isFavorite,
  onCopyClassical,
  onCopyExplanation,
  onCopySources,
  onToggleFavorite,
  feedbackRating,
  onSubmitFeedback
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

      <div className="feedback-row" aria-label={text.feedbackTitle}>
        <span>{text.feedbackTitle}</span>
        <div className="feedback-actions">
          {feedbackOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`ghost-button ${feedbackRating === option.value ? "feedback-active" : ""}`}
              onClick={() => onSubmitFeedback(variant, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <blockquote className="classical-block">{variant.classicalText}</blockquote>
      <ExplanationPanel variant={variant} />
      <SourcePanel refs={variant.sources} retrievalRefs={retrievalRefs} />
    </article>
  );
}
