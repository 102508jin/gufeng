import type { RetrievedChunk, SourceRef } from "@/lib/types/retrieval";

type SourcePanelProps = {
  refs: SourceRef[];
  retrievalRefs?: RetrievedChunk[];
};

export function SourcePanel({ refs, retrievalRefs = [] }: SourcePanelProps) {
  return (
    <section className="stack-section">
      <div className="section-header">
        <h4>Sources</h4>
      </div>

      <div className="source-list">
        {refs.map((refItem) => (
          <article key={refItem.id} className="source-card">
            <p className="source-tag">{refItem.sourceType === "persona" ? "Persona Corpus" : "Knowledge Base"}</p>
            <h5>{refItem.title}</h5>
            {refItem.author ? <p className="source-meta">{refItem.author}</p> : null}
            <p>{refItem.excerpt}</p>
          </article>
        ))}
      </div>

      {retrievalRefs.length ? (
        <details className="details-panel">
          <summary>View Retrieved Chunks</summary>
          <div className="retrieval-list">
            {retrievalRefs.map((chunk) => (
              <article key={chunk.id} className="retrieval-card">
                <p className="source-tag">{chunk.sourceType === "persona" ? "Persona Corpus" : "Knowledge Base"}</p>
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