"use client";

import { useEffect, useState } from "react";

type ProviderSettingsDialogProps = {
  open: boolean;
  value: {
    openaiBaseUrl: string;
    anthropicBaseUrl: string;
  };
  defaults: {
    openaiBaseUrl: string;
    anthropicBaseUrl: string;
  };
  onClose: () => void;
  onSave: (value: { openaiBaseUrl: string; anthropicBaseUrl: string }) => void;
};

const text = {
  title: "推理引擎配置",
  summary: "配置当前浏览器使用的模型接口覆盖项；留空时沿用服务端默认配置。",
  openAiLabel: "OpenAI API URL",
  anthropicLabel: "Claude API URL",
  emptyHint: "留空则使用服务端默认值",
  notConfigured: "未配置",
  invalidOpenAi: "OpenAI API URL 格式不正确，请输入 http(s) 地址。",
  invalidAnthropic: "Claude API URL 格式不正确，请输入 http(s) 地址。",
  reset: "清空覆盖",
  cancel: "取消",
  save: "保存设置"
} as const;

function trimBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/u, "");
}

function isValidBaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProviderSettingsDialog(props: ProviderSettingsDialogProps) {
  const [draft, setDraft] = useState(props.value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    setDraft(props.value);
    setError(null);
  }, [props.open, props.value]);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [props.open, props.onClose]);

  if (!props.open) {
    return null;
  }

  const openaiBaseUrl = trimBaseUrl(draft.openaiBaseUrl);
  const anthropicBaseUrl = trimBaseUrl(draft.anthropicBaseUrl);

  const handleSave = () => {
    if (openaiBaseUrl && !isValidBaseUrl(openaiBaseUrl)) {
      setError(text.invalidOpenAi);
      return;
    }

    if (anthropicBaseUrl && !isValidBaseUrl(anthropicBaseUrl)) {
      setError(text.invalidAnthropic);
      return;
    }

    props.onSave({
      openaiBaseUrl,
      anthropicBaseUrl
    });
  };

  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <div
        className="panel modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">模型设置</p>
            <h2 id="provider-settings-title">{text.title}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={props.onClose}>
            {text.cancel}
          </button>
        </div>

        <p className="panel-copy">{text.summary}</p>

        <label className="field-group">
          <span className="field-label">{text.openAiLabel}</span>
          <input
            className="field-input"
            type="url"
            inputMode="url"
            placeholder={props.defaults.openaiBaseUrl || text.emptyHint}
            value={draft.openaiBaseUrl}
            onChange={(event) => setDraft((current) => ({ ...current, openaiBaseUrl: event.target.value }))}
          />
          <span className="field-hint">
            {text.emptyHint}
            {`：${props.defaults.openaiBaseUrl || text.notConfigured}`}
          </span>
        </label>

        <label className="field-group">
          <span className="field-label">{text.anthropicLabel}</span>
          <input
            className="field-input"
            type="url"
            inputMode="url"
            placeholder={props.defaults.anthropicBaseUrl || text.emptyHint}
            value={draft.anthropicBaseUrl}
            onChange={(event) => setDraft((current) => ({ ...current, anthropicBaseUrl: event.target.value }))}
          />
          <span className="field-hint">
            {text.emptyHint}
            {`：${props.defaults.anthropicBaseUrl || text.notConfigured}`}
          </span>
        </label>

        {error ? <div className="panel error-panel modal-error">{error}</div> : null}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setDraft({ openaiBaseUrl: "", anthropicBaseUrl: "" });
              setError(null);
            }}
          >
            {text.reset}
          </button>
          <button type="button" className="primary-button modal-primary-button" onClick={handleSave}>
            {text.save}
          </button>
        </div>
      </div>
    </div>
  );
}
