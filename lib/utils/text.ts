import { COMMON_TOPICS } from "@/lib/config/constants";
import type { DetectedInputMode } from "@/lib/types/generation";

const CLASSICAL_MARKERS = ["\u4e4b", "\u4e4e", "\u8005", "\u4e5f", "\u77e3", "\u7109", "\u543e", "\u5c14", "\u5176", "\u592b", "\u76d6", "\u6bcb", "\u4f55\u4ee5", "\u82e5\u4f55"];
const CLASSICAL_REPLACEMENTS: Array<[string, string]> = [
  ["\u6211\u4eec", "\u543e\u8f88"],
  ["\u81ea\u5df1", "\u81ea"],
  ["\u5e94\u8be5", "\u5f53"],
  ["\u53ef\u4ee5", "\u53ef"],
  ["\u4e0d\u8981", "\u6bcb"],
  ["\u4e0d\u80fd", "\u4e0d\u53ef"],
  ["\u4e3a\u4ec0\u4e48", "\u4f55\u4ee5"],
  ["\u600e\u4e48", "\u82e5\u4f55"],
  ["\u5982\u4f55", "\u82e5\u4f55"],
  ["\u5b66\u4e60", "\u6cbb\u5b66"],
  ["\u670b\u53cb", "\u53cb\u670b"],
  ["\u4eba\u751f", "\u5904\u4e16"],
  ["\u65f6\u95f4", "\u5bf8\u9634"],
  ["\u575a\u6301", "\u6301\u6052"],
  ["\u52aa\u529b", "\u52e4\u52c9"],
  ["\u76ee\u6807", "\u6240\u5411"],
  ["\u65b9\u6cd5", "\u5176\u6cd5"],
  ["\u5185\u5fc3", "\u5176\u5fc3"],
  ["\u77e5\u9053", "\u77e5"],
  ["\u660e\u767d", "\u77e5"],
  ["\u5982\u679c", "\u82e5"],
  ["\u90a3\u4e48", "\u5219"],
  ["\u56e0\u4e3a", "\u76d6"],
  ["\u6240\u4ee5", "\u6545"],
  ["\u4f46\u662f", "\u7136"],
  ["\u95ee\u9898", "\u6240\u95ee"],
  ["\u4e8b\u60c5", "\u5176\u4e8b"]
];

export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function detectInputMode(input: string): DetectedInputMode {
  const text = normalizeWhitespace(input);
  const score = CLASSICAL_MARKERS.reduce((total, marker) => total + (text.includes(marker) ? 1 : 0), 0);
  return score >= 3 ? "classical" : "vernacular";
}

export function splitChineseSentences(input: string): string[] {
  return normalizeWhitespace(input)
    .split(/(?<=[\u3002\uff01\uff1f\uff1b])/u)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function extractKeywords(input: string): string[] {
  const text = normalizeWhitespace(input);
  const matchedTopics = COMMON_TOPICS.filter((topic) => text.includes(topic));
  const phraseMatches = text.match(/[\u4e00-\u9fff]{2,5}/gu) ?? [];
  const merged = [...matchedTopics, ...phraseMatches].filter((value) => value.length >= 2);
  return [...new Set(merged)].slice(0, 8);
}

export function scoreKeywordOverlap(query: string, content: string, keywords: string[] = []): number {
  const compactQuery = normalizeWhitespace(query);
  const joined = `${content} ${keywords.join(" ")}`;
  const queryKeywords = extractKeywords(compactQuery);
  const overlapScore = queryKeywords.reduce((total, keyword) => total + (joined.includes(keyword) ? 1 : 0), 0);
  return overlapScore + (joined.includes(compactQuery) ? 2 : 0);
}

export function classicalizeText(input: string): string {
  let output = normalizeWhitespace(input);

  for (const [from, to] of CLASSICAL_REPLACEMENTS) {
    output = output.replaceAll(from, to);
  }

  return output
    .replace(/[.?!]+$/u, "")
    .replace(/[\u3002\uff1f\uff01]+$/u, "");
}

export function inferIntent(query: string): string {
  const text = normalizeWhitespace(query);

  if (/(?:\u5982\u4f55|\u600e\u4e48|\u82e5\u4f55|\u4f55\u4ee5)/u.test(text)) {
    return "advice";
  }

  if (/(?:\u662f\u5426|\u80fd\u5426|\u53ef\u5426)/u.test(text)) {
    return "judgement";
  }

  return "reflection";
}

export function inferTone(query: string): string {
  const text = normalizeWhitespace(query);

  if (/(?:\u7126\u8651|\u8ff7\u832b|\u75db\u82e6|\u5bb3\u6015|\u62c5\u5fc3)/u.test(text)) {
    return "soothing";
  }

  if (/(?:\u5b66\u4e60|\u8003\u8bd5|\u8ba1\u5212|\u62d6\u5ef6|\u81ea\u5f8b)/u.test(text)) {
    return "instructive";
  }

  return "measured";
}

export function draftModernAnswer(query: string, topics: string[]): string[] {
  const text = `${query} ${topics.join(" ")}`;

  if (/(?:\u5b66\u4e60|\u8bfb\u4e66|\u8003\u8bd5|\u6cbb\u5b66)/u.test(text)) {
    return [
      "\u5b66\u4e60\u4e4b\u8981\uff0c\u5148\u5728\u7acb\u5fd7\uff0c\u6b21\u5728\u5faa\u5e8f\uff0c\u7ec8\u4e8e\u6301\u6052\u3002",
      "\u82e5\u4f46\u6c42\u901f\u6210\uff0c\u5219\u5fc3\u6d6e\u800c\u529f\u6d45\uff1b\u82e5\u80fd\u65e5\u79ef\u6708\u7d2f\uff0c\u5219\u6240\u5b66\u81ea\u6df1\u3002",
      "\u5b9c\u5b9a\u5c0f\u76ee\u6807\uff0c\u65e5\u65e5\u6e29\u4e60\uff0c\u9047\u7591\u5373\u95ee\uff0c\u4e0d\u4ee5\u4e00\u65f6\u8fdf\u949d\u81ea\u8f7b\u3002"
    ];
  }

  if (/(?:\u65f6\u95f4|\u62d6\u5ef6|\u81ea\u5f8b|\u6548\u7387|\u8ba1\u5212)/u.test(text)) {
    return [
      "\u6cbb\u4e8b\u8d35\u65e9\uff0c\u6210\u4e8b\u8d35\u6052\u3002",
      "\u4e0e\u5176\u7a7a\u5fe7\u6765\u65e5\uff0c\u4e0d\u82e5\u5148\u5b9a\u4eca\u65e5\u53ef\u884c\u4e4b\u4e00\u4e8b\uff0c\u7acb\u5373\u8d77\u884c\u3002",
      "\u65e5\u65e5\u7701\u5176\u8fdb\u9000\uff0c\u5c0f\u529f\u65e2\u79ef\uff0c\u5927\u4e8b\u53ef\u6210\u3002"
    ];
  }

  if (/(?:\u670b\u53cb|\u4ea4\u5f80|\u4eba\u9645|\u5904\u4e16)/u.test(text)) {
    return [
      "\u4e0e\u4eba\u76f8\u4ea4\uff0c\u8d35\u5728\u8bda\u656c\uff0c\u4e0d\u53ef\u6025\u4e8e\u6c42\u5408\u3002",
      "\u89c1\u5584\u5219\u4eb2\u4e4b\uff0c\u89c1\u4e0d\u5584\u5219\u8fdc\u4e4b\uff1b\u4e8e\u5df1\u5219\u614e\u8a00\uff0c\u4e8e\u4eba\u5219\u5bbd\u5bdf\u3002",
      "\u5b88\u5206\u5b88\u4fe1\uff0c\u4e45\u800c\u81ea\u6709\u53ef\u4eb2\u4e4b\u4eba\u3002"
    ];
  }

  if (/(?:\u4eba\u751f|\u8ff7\u832b|\u9009\u62e9|\u524d\u9014|\u76ee\u6807|\u5fd7\u5411)/u.test(text)) {
    return [
      "\u4eba\u4e4b\u6240\u60a3\uff0c\u5e38\u4e0d\u5728\u8def\u5c11\uff0c\u800c\u5728\u5fc3\u591a\u6447\u3002",
      "\u5148\u95ee\u6240\u91cd\u4e3a\u4f55\uff0c\u518d\u62e9\u5176\u6700\u53ef\u4e45\u884c\u8005\uff0c\u6bcb\u4e3a\u4e00\u65f6\u58f0\u8a89\u6240\u593a\u3002",
      "\u5fd7\u5b9a\u4e4b\u540e\uff0c\u7f13\u6b65\u800c\u884c\uff0c\u867d\u8fdf\u65e0\u5bb3\uff0c\u60df\u4e0d\u53ef\u4e2d\u8f8d\u3002"
    ];
  }

  if (/(?:\u5b64\u72ec|\u60c5\u7eea|\u96be\u8fc7|\u75db\u82e6|\u7126\u8651|\u62c5\u5fc3)/u.test(text)) {
    return [
      "\u5fc3\u6709\u90c1\u7ed3\uff0c\u4e0d\u53ef\u5f3a\u6291\uff0c\u5b9c\u5f90\u5f90\u7406\u4e4b\u3002",
      "\u5148\u4f7f\u8eab\u5fc3\u6709\u5b9a\u5904\uff0c\u6216\u8bfb\u4e66\uff0c\u6216\u6563\u6b65\uff0c\u6216\u4e0e\u53ef\u4fe1\u4e4b\u4eba\u4e00\u8a00\uff0c\u7686\u53ef\u8212\u5176\u6c14\u3002",
      "\u60c5\u7eea\u4e4b\u6765\uff0c\u975e\u5e38\u4f4f\u4e5f\uff1b\u5b88\u5176\u8282\u5f8b\uff0c\u4e45\u4e4b\u81ea\u5e73\u3002"
    ];
  }

  return [
    "\u51e1\u4e8b\u5148\u5ba1\u5176\u672c\uff0c\u518d\u56fe\u5176\u672b\u3002",
    "\u77e5\u5176\u6240\u5411\uff0c\u5219\u8a00\u884c\u4e0d\u4e71\uff1b\u5b88\u5176\u8282\u5ea6\uff0c\u5219\u8fdb\u9000\u6709\u5e38\u3002",
    "\u82df\u80fd\u614e\u601d\u7b03\u884c\uff0c\u867d\u4e8b\u672a\u901f\u6210\uff0c\u4ea6\u5df2\u5728\u6b63\u8def\u4e4b\u4e0a\u3002"
  ];
}

export function toExcerpt(input: string, max = 72): string {
  const text = normalizeWhitespace(input);
  return text.length <= max ? text : `${text.slice(0, max)}...`;
}