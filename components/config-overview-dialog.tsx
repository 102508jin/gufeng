"use client";

import { useEffect } from "react";

import type { HealthStatus } from "@/lib/services/health-service";
import type { PublicModelProfile } from "@/lib/types/provider";

type ConfigOverviewDialogProps = {
  open: boolean;
  activeProfileName: string;
  selectedProvider?: PublicModelProfile | null;
  selectedProviderBaseUrl: string;
  connectionStatusDetail: string;
  maxCompletionTokensLabel: string;
  aiInterventionLabel: string;
  retrievalModeLabel: string;
  personaName: string;
  historyCount: number;
  favoriteCount: number;
  feedbackCount: number;
  healthStatus: HealthStatus | null;
  isTestingConnection: boolean;
  onClose: () => void;
  onTestConnection: () => void;
  onOpenProviders: () => void;
  onExportProfileBackup: () => void;
  onOpenKnowledge: () => void;
};

const text = {
  eyebrow: "Config",
  title: "配置呈现",
  close: "关闭",
  profile: "本地配置档",
  provider: "模型服务",
  driver: "接口类型",
  model: "模型",
  baseUrl: "API 基础 URL",
  connection: "连接状态",
  tokenBudget: "最大输出 Token",
  intervention: "AI 介入",
  retrieval: "知识库",
  persona: "当前角色",
  memory: "本地记忆",
  health: "系统健康",
  corpus: "语料",
  index: "向量索引",
  embedding: "Embedding",
  unavailable: "未配置",
  noHealth: "尚未取得健康状态",
  ok: "正常",
  degraded: "降级",
  test: "测试连接",
  testing: "测试中...",
  providers: "模型设置",
  backup: "备份配置档",
  knowledge: "知识库"
} as const;

function formatUpdatedAt(value?: string) {
  if (!value) {
    return "未知";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function ConfigOverviewDialog(props: ConfigOverviewDialogProps) {
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
  }, [props]);

  if (!props.open) {
    return null;
  }

  const health = props.healthStatus;
  const statusText = health?.status === "ok" ? text.ok : health?.status === "degraded" ? text.degraded : text.noHealth;
  const runAndClose = (action: () => void) => {
    action();
    props.onClose();
  };

  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <section
        className="panel modal-card workspace-dialog config-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-overview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{text.eyebrow}</p>
            <h2 id="config-overview-title">{text.title}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={props.onClose}>
            {text.close}
          </button>
        </div>

        <div className="dialog-info-grid">
          <span>{text.profile}</span>
          <strong>{props.activeProfileName || text.unavailable}</strong>
          <span>{text.provider}</span>
          <strong>{props.selectedProvider?.label ?? text.unavailable}</strong>
          <span>{text.driver}</span>
          <strong>{props.selectedProvider?.driver ?? text.unavailable}</strong>
          <span>{text.model}</span>
          <strong>{props.selectedProvider?.model ?? text.unavailable}</strong>
          <span>{text.baseUrl}</span>
          <strong className="breakable-text">{props.selectedProviderBaseUrl || text.unavailable}</strong>
          <span>{text.connection}</span>
          <strong>{props.connectionStatusDetail}</strong>
          <span>{text.tokenBudget}</span>
          <strong>{props.maxCompletionTokensLabel}</strong>
          <span>{text.intervention}</span>
          <strong>{props.aiInterventionLabel}</strong>
          <span>{text.retrieval}</span>
          <strong>{props.retrievalModeLabel}</strong>
          <span>{text.persona}</span>
          <strong>{props.personaName}</strong>
          <span>{text.memory}</span>
          <strong>
            历史 {props.historyCount} · 收藏 {props.favoriteCount} · 反馈 {props.feedbackCount}
          </strong>
        </div>

        <section className="dialog-health-card">
          <div className="config-status-row">
            <div>
              <p className="eyebrow">{text.health}</p>
              <h3>{statusText}</h3>
            </div>
            <span className={`provider-state ${health?.status === "ok" ? "provider-state-ready" : ""}`}>
              {statusText}
            </span>
          </div>

          {health ? (
            <div className="dialog-info-grid compact-info-grid">
              <span>{text.corpus}</span>
              <strong>角色 {health.corpus.personas} · 知识 {health.corpus.knowledge}</strong>
              <span>{text.index}</span>
              <strong>
                {health.index.vectorDocuments}/{health.index.expectedDocuments} · {health.index.stale ? "需更新" : "可检索"}
              </strong>
              <span>{text.embedding}</span>
              <strong>{health.embedding.label} · {health.embedding.configured ? "已配置" : "未配置"}</strong>
              <span>更新时间</span>
              <strong>{formatUpdatedAt(health.index.updatedAt ?? health.timestamp)}</strong>
            </div>
          ) : (
            <p className="panel-copy">{text.noHealth}</p>
          )}
        </section>

        <div className="dialog-action-grid" aria-label="配置快捷操作">
          <button type="button" className="small-button" onClick={props.onTestConnection} disabled={props.isTestingConnection}>
            {props.isTestingConnection ? text.testing : text.test}
          </button>
          <button type="button" className="small-button" onClick={() => runAndClose(props.onOpenProviders)}>
            {text.providers}
          </button>
          <button type="button" className="small-button" onClick={() => runAndClose(props.onExportProfileBackup)}>
            {text.backup}
          </button>
          <button type="button" className="small-button" onClick={() => runAndClose(props.onOpenKnowledge)}>
            {text.knowledge}
          </button>
        </div>
      </section>
    </div>
  );
}
