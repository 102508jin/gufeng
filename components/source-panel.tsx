import type { RetrievedChunk, SourceRef } from "@/lib/types/retrieval";

type SourcePanelProps = {
  refs: SourceRef[];
  retrievalRefs?: RetrievedChunk[];
};

const text = {
  title: "\u53c2\u8003\u6765\u6e90",
  persona: "\u4eba\u7269\u8bed\u6599",
  knowledge: "\u77e5\u8bc6\u5e93",
  details: "\u67e5\u770b\u53ec\u56de\u7247\u6bb5",
  score: "\u76f8\u5173\u5ea6",
  chunk: "\u7247\u6bb5",
  license: "\u8bb8\u53ef"
} as const;

function formatSourceType(sourceType: SourceRef["sourceType"] | RetrievedChunk["sourceType"]) {
  return sourceType === "persona" ? text.persona : text.knowledge;
}

function formatSourceMeta(refItem: SourceRef): string | null {
  const items = [
    refItem.author,
    refItem.source,
    refItem.chunkId ? `${text.chunk} ${refItem.chunkId}` : null,
    refItem.license ? `${text.license} ${refItem.license}` : null
  ].filter(Boolean);

  return items.length ? items.join(" · ") : null;
}

function formatChunkMeta(chunk: RetrievedChunk): string | null {
  const items = [
    chunk.author,
    typeof chunk.metadata.source === "string" ? chunk.metadata.source : null,
    typeof chunk.metadata.chunkId === "string" ? `${text.chunk} ${chunk.metadata.chunkId}` : null,
    typeof chunk.metadata.license === "string" ? `${text.license} ${chunk.metadata.license}` : null
  ].filter(Boolean);

  return items.length ? items.join(" · ") : null;
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
            <div className="source-card-header">
              <p className="source-tag">{formatSourceType(refItem.sourceType)}</p>
              <span className="source-score">{`${text.score} ${refItem.score.toFixed(2)}`}</span>
            </div>
            <h5>{refItem.title}</h5>
            {formatSourceMeta(refItem) ? <p className="source-meta">{formatSourceMeta(refItem)}</p> : null}
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
                {formatChunkMeta(chunk) ? <p className="source-meta">{formatChunkMeta(chunk)}</p> : null}
                <p>{chunk.summary ?? chunk.content}</p>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
