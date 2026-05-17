import type { ModelProvider } from "@/lib/infra/llm/model-provider";
import type { ExplanationMode, ExplanationResult, GeneratedVariantDraft, GenerationContext, LinePair } from "@/lib/types/generation";
import { splitChineseSentences } from "@/lib/utils/text";

const REVERSE_REPLACEMENTS: Array<[string, string]> = [
  ["逝者如斯", "时间像流水一样逝去"],
  ["不舍昼夜", "日夜不停"],
  ["白驹过隙", "时间过得极快"],
  ["光阴似箭", "时间像箭一样飞快"],
  ["日月如梭", "岁月往来迅疾"],
  ["寸阴", "短暂的时间"],
  ["分阴", "片刻时间"],
  ["韶华", "青春时光"],
  ["岁华", "年华"],
  ["朱颜", "年轻容颜"],
  ["霜鬓", "斑白的鬓发"],
  ["青丝", "黑发"],
  ["雪色", "白发的颜色"],
  ["岁月蹉跎", "光阴虚度"],
  ["蹉跎岁月", "虚度时光"],
  ["蹉跎", "虚度"],
  ["易逝", "容易流逝"],
  ["虚掷", "白白浪费"],
  ["少壮不努力，老大徒伤悲", "年轻时不努力，年老时只能徒然悲伤"],
  ["少壮不努力", "年轻时不努力"],
  ["老大徒伤悲", "年老后徒然悲伤"],
  ["功业", "事业成就"],
  ["寸功", "一点功业"],
  ["未建", "还没有建立"],
  ["未立", "还没有成就"],
  ["抚膺", "捶胸感叹"],
  ["长太息", "深深叹息"],
  ["长叹", "长久叹息"],
  ["慨然", "感慨的样子"],
  ["可表", "可以称道"],
  ["其徂", "它不断远去"],
  ["忽焉", "转眼之间"],
  ["倏忽", "忽然之间"],
  ["一世", "一生"],
  ["少时", "年轻时候"],
  ["所立之志", "曾经立下的志向"],
  ["未及展施", "还没来得及施展"],
  ["已暮", "已经晚了"],
  ["每念及此", "每当想到这里"],
  ["未尝不", "没有不"],
  ["悔之晚矣", "后悔已经晚了"],
  ["惟余一叹", "只剩下一声叹息"],
  ["百代之过客", "贯穿古今的过客"],
  ["春花秋月", "春花秋月的时序变化"],
  ["循环往复", "不断循环更替"],
  ["秉烛夜游", "趁夜持烛游赏，常指珍惜短暂人生"],
  ["志未酬", "志向没有实现"],
  ["对镜", "面对镜子"],
  ["后来者", "后来的人"],
  ["鉴之", "以此为鉴"],
  ["莫待", "不要等到"],
  ["白首", "头发变白"],
  ["读书迟", "读书已经太迟"],
  ["恍若", "仿佛"],
  ["鬓染微霜", "鬓发已经微微发白"],
  ["及至", "等到"],
  ["方觉", "才觉得"],
  ["非昨", "已经不是昨日的样子"],
  ["天地玄黄", "天地开阔久远"],
  ["宇宙洪荒", "宇宙广大古老"],
  ["蜉蝣", "朝生暮死的小虫，比喻人生短暂"],
  ["朝暮", "很短的时间"],
  ["陶侃运甓", "陶侃搬砖自励，珍惜时间勤勉不怠"],
  ["吾辈", "我们"],
  ["其心", "内心"],
  ["何以", "为什么"],
  ["若何", "如何"],
  ["治学", "学习"],
  ["友朋", "朋友"],
  ["寸阴", "时间"],
  ["持恒", "坚持"],
  ["勤勉", "努力"],
  ["所向", "目标"],
  ["其法", "方法"],
  ["其事", "事情"],
  ["毋", "不要"],
  ["不可", "不能"],
  ["笃行", "切实去做"],
  ["即起而行", "马上行动"],
  ["日省", "每日反省"],
  ["立志", "立下志向"]
];

const text = {
  removePrefixPattern: /^(?:夫|盖|子曰：|亮以为：|余谓：|答曰：)/u,
  noteGai: "“盖”常用来引出判断或申论。",
  noteFu: "“夫”多作起句发端，使语势更稳。",
  noteWu: "“毋”即“不要”，语气较简劲。",
  noteZhi: "“志”多指志向、定向之心。",
  freePrefix: "大意是：",
  separator: "；",
  fallbackGloss: "解释依据当前文言句中的关键词和典故生成，逐句对应原文。"
} as const;

function vernacularizeSegment(segment: string): string {
  let output = segment.replace(text.removePrefixPattern, "").trim();
  for (const [from, to] of REVERSE_REPLACEMENTS) {
    output = output.replaceAll(from, to);
  }
  output = output
    .replace(/者/gu, "的人或事")
    .replace(/也/gu, "")
    .replace(/矣/gu, "了")
    .replace(/乎/gu, "吗")
    .replace(/哉/gu, "啊")
    .replace(/焉/gu, "于是")
    .replace(/其/gu, "它的")
    .replace(/之/gu, "的")
    .replace(/吾/gu, "我")
    .replace(/余/gu, "我")
    .replace(/若/gu, "像")
    .replace(/故/gu, "所以")
    .replace(/[；;]$/u, "")
    .replace(/[。.!！?？]$/u, "")
    .trim();

  return output ? `这句说：${output}。` : "这句承接上文，表达对岁月流逝的感叹。";
}

function buildNotes(segment: string): string[] {
  const notes: string[] = [];
  if (segment.includes("逝者如斯")) {
    notes.push("化用《论语》“逝者如斯夫”，写时间如流水。");
  }
  if (segment.includes("白驹过隙")) {
    notes.push("“白驹过隙”比喻时间极短、流逝极快。");
  }
  if (segment.includes("少壮不努力")) {
    notes.push("化用古诗句，强调虚度年少后的追悔。");
  }
  if (segment.includes("陶侃运甓")) {
    notes.push("“陶侃运甓”写勤勉自励，反衬虚度光阴。");
  }
  if (segment.includes("盖")) {
    notes.push(text.noteGai);
  }
  if (segment.includes("夫")) {
    notes.push(text.noteFu);
  }
  if (segment.includes("毋")) {
    notes.push(text.noteWu);
  }
  if (segment.includes("志")) {
    notes.push(text.noteZhi);
  }
  return notes;
}

function isStandalonePunctuation(value: string): boolean {
  return /^[。；，、！？：]+$/u.test(value.trim());
}

function buildFallbackExplanation(draft: GeneratedVariantDraft, context: GenerationContext): ExplanationResult {
  const segments = splitChineseSentences(draft.classicalText).filter((segment) => !isStandalonePunctuation(segment));

  const lineByLinePairs: LinePair[] = segments.map((segment) => ({
    classicalSegment: segment,
    vernacularSegment: vernacularizeSegment(segment),
    notes: buildNotes(segment)
  }));

  const literalExplanation = lineByLinePairs.map((pair) => pair.vernacularSegment).join(text.separator);
  const freeExplanation = `${text.freePrefix}${lineByLinePairs
    .map((pair) => pair.vernacularSegment)
    .join("")}`;
  const glossExplanation =
    lineByLinePairs
      .flatMap((pair) => pair.notes ?? [])
      .filter(Boolean)
      .join(text.separator) || text.fallbackGloss;

  return {
    literalExplanation,
    freeExplanation,
    glossExplanation,
    lineByLinePairs
  };
}

export interface ExplanationGenerator {
  explain(params: {
    draft: GeneratedVariantDraft;
    context: GenerationContext;
    explanationModes: ExplanationMode[];
  }): Promise<ExplanationResult>;
}

export class DefaultExplanationGenerator implements ExplanationGenerator {
  constructor(private readonly modelProvider: ModelProvider) {}

  async explain(params: {
    draft: GeneratedVariantDraft;
    context: GenerationContext;
    explanationModes: ExplanationMode[];
  }): Promise<ExplanationResult> {
    return buildFallbackExplanation(params.draft, params.context);
  }
}
