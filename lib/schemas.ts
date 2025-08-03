// JSON Schemas for validation
export const QuestionsSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        required: [
          "id","question","intent_tag",
          "difficulty","gotcha_level",
          "expected_evidence","risk_area"
        ],
        properties: {
          id: { type: "string" },
          question: { type: "string", minLength: 5 },
          intent_tag: { type: "string" },
          difficulty: { type: "integer", minimum: 1, maximum: 5 },
          gotcha_level: { type: "integer", minimum: 0, maximum: 3 },
          expected_evidence: { type: "string" },
          risk_area: { type: "string" }
        }
      }
    }
  },
  required: ["questions"]
} as const;

export const FollowUpSchema = {
  type: "object",
  properties: {
    follow_up_question: { type: "string", minLength: 5, maxLength: 200 },
    rationale_tags: { type: "array", items: { type: "string" }, maxItems: 5 }
  },
  required: ["follow_up_question","rationale_tags"]
} as const;

// シミュレーション用のSchemas
export const SimulationStartSchema = {
  type: "object",
  properties: {
    next_question: { type: "string", minLength: 5, maxLength: 200 }
  },
  required: ["next_question"]
} as const;

export const SimulationTurnSchema = {
  type: "object",
  properties: {
    next_question: { type: "string", minLength: 5, maxLength: 200 }
  },
  required: ["next_question"]
} as const;

// TypeScript types based on schemas
export interface Question {
  id: string;
  question: string;
  intent_tag: string;
  difficulty: number;
  gotcha_level: number;
  expected_evidence: string;
  risk_area: string;
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface FollowUpResponse {
  follow_up_question: string;
  rationale_tags: string[];
}

// シミュレーション用の型定義
export interface SimulationStartResponse {
  next_question: string;
}

export interface SimulationTurnResponse {
  next_question: string;
}