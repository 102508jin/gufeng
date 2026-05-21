"use client";

import { useEffect } from "react";

type HelpCenterDialogProps = {
  open: boolean;
  onClose: () => void;
  onUseSample: () => void;
  onOpenKnowledge: () => void;
  onOpenProviders: () => void;
  onOpenMemory: () => void;
};

const text = {
  eyebrow: "Help",
  title: "帮助中心",
  close: "关闭",
  workflowTitle: "常用流程",
  workflowCopy: "从提问、生成、溯源到收藏，适合日常文言研习与润色。",
  modulesTitle: "模块入口",
  modulesCopy: "知识库负责语料与召回，模型设置负责 provider 与输出长度，历史收藏负责复用成果。",
  troubleshootingTitle: "问题处理",
  sample: "填入示例问题",
  knowledge: "进入知识库",
  providers: "进入模型设置",
  memory: "查看历史收藏"
} as const;

export function HelpCenterDialog(props: HelpCenterDialogProps) {
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

  const runAction = (action: () => void) => {
    action();
    props.onClose();
  };

  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <section
        className="panel modal-card workspace-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-center-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{text.eyebrow}</p>
            <h2 id="help-center-title">{text.title}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={props.onClose}>
            {text.close}
          </button>
        </div>

        <div className="dialog-section-grid">
          <article className="dialog-info-card">
            <p className="eyebrow">{text.workflowTitle}</p>
            <h3>提问后生成多版文言回答</h3>
            <p>{text.workflowCopy}</p>
          </article>
          <article className="dialog-info-card">
            <p className="eyebrow">{text.modulesTitle}</p>
            <h3>按任务切换工作区模块</h3>
            <p>{text.modulesCopy}</p>
          </article>
          <article className="dialog-info-card">
            <p className="eyebrow">{text.troubleshootingTitle}</p>
            <h3>连接失败先测模型，再看知识库</h3>
            <p>若模型不可用，进入模型设置测试连接；若来源不足，进入知识库运行检索预检或重建索引。</p>
          </article>
        </div>

        <div className="dialog-action-grid" aria-label="帮助快捷操作">
          <button type="button" className="small-button" onClick={() => runAction(props.onUseSample)}>
            {text.sample}
          </button>
          <button type="button" className="small-button" onClick={() => runAction(props.onOpenKnowledge)}>
            {text.knowledge}
          </button>
          <button type="button" className="small-button" onClick={() => runAction(props.onOpenProviders)}>
            {text.providers}
          </button>
          <button type="button" className="small-button" onClick={() => runAction(props.onOpenMemory)}>
            {text.memory}
          </button>
        </div>
      </section>
    </div>
  );
}
