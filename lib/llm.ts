import OpenAI from 'openai';
import { logger } from './logging';

// Initialize OpenAI client with Qwen3 configuration
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.QWEN_BASE_URL,
});

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

export async function callQwen3(options: LLMCallOptions): Promise<LLMResponse> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  try {
    logger.info('Starting LLM call', {
      request_id: requestId,
      model: process.env.QWEN_MODEL,
      temperature: options.temperature || 0.3
    });

    const response = await client.chat.completions.create({
      model: process.env.QWEN_MODEL || 'qwen3-32b-instruct',
      messages: [
        {
          role: 'system',
          content: options.systemPrompt
        },
        {
          role: 'user',
          content: options.userPrompt
        }
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2000,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '';
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;

    logger.apiCall(
      'llm-call',
      requestId,
      process.env.QWEN_MODEL || 'qwen3-32b-instruct',
      latencyMs,
      promptTokens,
      completionTokens,
      'success'
    );

    return {
      content,
      promptTokens,
      completionTokens,
      latencyMs
    };

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    logger.error('LLM call failed', {
      request_id: requestId,
      model: process.env.QWEN_MODEL,
      latency_ms: latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error',
      outcome: 'error'
    });

    throw error;
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function extractJSON(text: string): string {
  // Remove thinking tags and other common prefixes
  let cleaned = text.trim();
  
  // Remove <think>...</think> blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Remove other common tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/```[^`]*```/g, '');
  
  // Remove leading text before the first {
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) {
    cleaned = cleaned.substring(firstBrace);
  }
  
  // Remove trailing text after the last }
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }
  
  return cleaned.trim();
}

// Legacy prompts (will be replaced by prompts.ts)
import { DEFAULT_QUESTIONS_PROMPT, DEFAULT_FOLLOWUP_PROMPT } from './prompts';

export const SYSTEM_PROMPTS = {
  QUESTIONS_GENERATION: DEFAULT_QUESTIONS_PROMPT,
  FOLLOWUP_GENERATION: DEFAULT_FOLLOWUP_PROMPT
};

export function createQuestionsPrompt(topic: string, context?: string): string {
  return `【テーマ】:
${topic}

【補足/URL/背景（任意）】:
${context || 'なし'}`;
}

export function createFollowUpPrompt(
  prevQuestion: string, 
  answer: string, 
  threadNotes?: string
): string {
  return `【直前の質問】: ${prevQuestion}
【広報回答】: ${answer}
【論点メモ（任意）】: ${threadNotes || 'なし'}`;
}