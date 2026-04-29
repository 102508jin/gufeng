"use client";

import { useRef, useState } from "react";

import type { KnowledgeImportInput } from "@/lib/types/knowledge-import";

type KnowledgeImportPanelProps = {
  disabled?: boolean;
  importing?: boolean;
  importError?: string | null;
  importSummary?: string | null;
  onImport: (documents: KnowledgeImportInput[]) => Promise<void>;
};

const text = {
  title: "知识库导入",
  copy: "导入本地语料后会自动重建 processed corpus 与 vector index。",
  titleLabel: "标题",
  titlePlaceholder: "例如：拖延与自律笔记",
  categoryLabel: "分类",
  sourceLabel: "来源",
  licenseLabel: "许可",
  credibilityLabel: "可信度",
  keywordsLabel: "关键词",
  contentLabel: "正文",
  contentPlaceholder: "粘贴要导入的知识库文本，至少 8 个字符。",
  importOne: "导入当前文本",
  importing: "导入中...",
  fileImport: "导入 TXT / JSON",
  low: "低",
  medium: "中",
  high: "高",
  jsonInvalid: "JSON 文件格式不合法。",
  fileReadFailed: "文件读取失败。"
} as const;

function splitKeywords(value: string): string[] {
  return value
    .split(/[,，、\s]+/u)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 16);
}

function parseJsonDocuments(input: unknown): KnowledgeImportInput[] {
  const items = Array.isArray(input) ? input : [input];
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Partial<KnowledgeImportInput>;
    if (typeof record.title !== "string" || typeof record.content !== "string") {
      return [];
    }

    return [{
      ...record,
      title: record.title,
      content: record.content,
      keywords: Array.isArray(record.keywords) ? record.keywords.filter((keyword): keyword is string => typeof keyword === "string") : undefined
    }];
  });
}

export function KnowledgeImportPanel(props: KnowledgeImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("user-import");
  const [source, setSource] = useState("user-import");
  const [license, setLicense] = useState("user-provided");
  const [credibility, setCredibility] = useState<KnowledgeImportInput["credibility"]>("medium");
  const [keywords, setKeywords] = useState("");
  const [content, setContent] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const disabled = props.disabled || props.importing;

  const submitCurrentDocument = async () => {
    setLocalError(null);
    try {
      await props.onImport([{
        title,
        category,
        source,
        license,
        credibility,
        keywords: splitKeywords(keywords),
        content
      }]);
      setTitle("");
      setKeywords("");
      setContent("");
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : null);
    }
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setLocalError(null);
    try {
      const raw = await file.text();
      if (file.name.toLowerCase().endsWith(".json")) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw) as unknown;
        } catch {
          setLocalError(text.jsonInvalid);
          return;
        }

        const documents = parseJsonDocuments(parsed);
        if (!documents.length) {
          setLocalError(text.jsonInvalid);
          return;
        }

        try {
          await props.onImport(documents);
        } catch (error) {
          setLocalError(error instanceof Error ? error.message : null);
        }
      } else {
        setTitle((current) => current || file.name.replace(/\.[^.]+$/u, ""));
        setContent(raw);
      }
    } catch {
      setLocalError(file.name.toLowerCase().endsWith(".json") ? text.jsonInvalid : text.fileReadFailed);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="panel knowledge-import-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RAG</p>
          <h2>{text.title}</h2>
        </div>
        <p className="panel-copy">{text.copy}</p>
      </div>

      <div className="field-grid">
        <label className="field-group">
          <span className="field-label">{text.titleLabel}</span>
          <input className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={text.titlePlaceholder} disabled={disabled} />
        </label>
        <label className="field-group">
          <span className="field-label">{text.categoryLabel}</span>
          <input className="field-input" value={category} onChange={(event) => setCategory(event.target.value)} disabled={disabled} />
        </label>
      </div>

      <div className="field-grid">
        <label className="field-group">
          <span className="field-label">{text.sourceLabel}</span>
          <input className="field-input" value={source} onChange={(event) => setSource(event.target.value)} disabled={disabled} />
        </label>
        <label className="field-group">
          <span className="field-label">{text.licenseLabel}</span>
          <input className="field-input" value={license} onChange={(event) => setLicense(event.target.value)} disabled={disabled} />
        </label>
      </div>

      <div className="field-grid">
        <label className="field-group">
          <span className="field-label">{text.credibilityLabel}</span>
          <select className="field-input field-select" value={credibility} onChange={(event) => setCredibility(event.target.value as KnowledgeImportInput["credibility"])} disabled={disabled}>
            <option value="low">{text.low}</option>
            <option value="medium">{text.medium}</option>
            <option value="high">{text.high}</option>
          </select>
        </label>
        <label className="field-group">
          <span className="field-label">{text.keywordsLabel}</span>
          <input className="field-input" value={keywords} onChange={(event) => setKeywords(event.target.value)} disabled={disabled} />
        </label>
      </div>

      <label className="field-group">
        <span className="field-label">{text.contentLabel}</span>
        <textarea className="field-input field-textarea compact-textarea" value={content} onChange={(event) => setContent(event.target.value)} placeholder={text.contentPlaceholder} disabled={disabled} />
      </label>

      <div className="knowledge-import-actions">
        <button type="button" className="secondary-button" onClick={() => void submitCurrentDocument()} disabled={disabled || !title.trim() || content.trim().length < 8}>
          {props.importing ? text.importing : text.importOne}
        </button>
        <label className="small-button file-button">
          {text.fileImport}
          <input ref={fileInputRef} type="file" accept=".txt,.json,application/json,text/plain" disabled={disabled} onChange={(event) => void handleFileChange(event.target.files?.[0])} />
        </label>
      </div>

      {localError || props.importError ? <p className="inline-error">{localError ?? props.importError}</p> : null}
      {props.importSummary ? <p className="inline-success">{props.importSummary}</p> : null}
    </section>
  );
}
