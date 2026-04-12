export type PersonaId = "kongzi" | "zhuge-liang" | "tao-yuanming";

export type PersonaProfile = {
  id: string;
  name: string;
  dynasty?: string;
  description: string;
  styleSummary: string;
  sourceCount: number;
};

export type PersonaSource = {
  id: string;
  title: string;
  author?: string;
  content: string;
  summary?: string;
  keywords: string[];
  credibility: "low" | "medium" | "high";
};

export type PersonaRecord = PersonaProfile & {
  sources: PersonaSource[];
};