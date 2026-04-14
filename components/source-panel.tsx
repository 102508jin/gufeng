import type { RetrievedChunk, SourceRef } from "@/lib/types/retrieval";

type SourcePanelProps = {
  refs: SourceRef[];
  retrievalRefs?: RetrievedChunk[];
};

const text = {
  title: "\u53c2\u8003\u6765\u6e90",
  persona: "\u4eba\u7269\u8bed\u6599",
  knowledge: "\u77e5\u8bc6\u5e93",
  details: "\u67e5\u770b\u53ec\u56de\u7247\u6bb5"
} as const;

function formatSourceType(sourceType: SourceRef["sourceType"] | RetrievedChunk["sourceType"]) {
  return sourceType === "persona" ? text.persona : text.knowledge;
}

export function SourcePanel({ refs, retrievalRefs = [] }: SourcePanelProps) {
  return (
    <section className="stack-section">
      <div className="section-header">
        <h4>{text.title}</h4>
      </div>

      <div className="source-list">
        {refs.map((refItem) => (
          <article key={refItem.id} className="source-card">
            <p className="source-tag">{formatSourceType(refItem.sourceType)}</p>
            <h5>{refItem.title}</h5>
            {refItem.author ? <p className="source-meta">{refItem.author}</p> : null}
            <p>{refItem.excerpt}</p>
          </article>
        ))}
      </div>

      {retrievalRefs.length ? (
        <details className="details-panel">
          <summary>{text.details}</summary>
          <div className="retrieval-list">
            {retrievalRefs.map((chunk) => (
              <article key={chunk.id} className="retrieval-card">
                <p className="source-tag">{formatSourceType(chunk.sourceType)}</p>
                <h5>{chunk.title}</h5>
                <p>{chunk.summary ?? chunk.content}</p>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
