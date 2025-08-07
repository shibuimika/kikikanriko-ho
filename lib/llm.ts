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

    // Check for empty or invalid response
    if (!content || content.trim().length === 0) {
      throw new Error('LLM returned empty response');
    }

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
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from LLM');
  }

  let cleaned = text.trim();
  
  // Log for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Original text length:', text.length);
    console.log('Text preview:', text.substring(0, 200));
  }
  
  // Pre-processing: if text starts with <think> but no valid JSON follows, try to extract JSON
  if (cleaned.startsWith('<think') && !cleaned.includes('</think>')) {
    // Find the first { after any <think> tag
    const jsonStart = cleaned.search(/\{/);
    if (jsonStart > 0) {
      cleaned = cleaned.substring(jsonStart);
    }
  }
  
  // Step 1: Very aggressive removal of thinking blocks
  // First, handle closed thinking blocks
  cleaned = cleaned.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<reason\b[^>]*>[\s\S]*?<\/reason>/gi, '');
  cleaned = cleaned.replace(/<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi, '');
  
  // Then, remove everything starting from any unclosed opening tag
  cleaned = cleaned.replace(/<think\b[^>]*>[\s\S]*/gi, '');
  cleaned = cleaned.replace(/<thinking\b[^>]*>[\s\S]*/gi, '');
  
  // Special case: if text starts with <think>, remove everything up to the first {
  if (cleaned.startsWith('<think')) {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }
  }
  
  // Step 2: Remove all remaining HTML/XML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Step 3: Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  
  // Step 4: Clean up whitespace and newlines
  cleaned = cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Step 5: Extract JSON using multiple strategies
  let jsonResult = '';
  
  // Strategy 1: Try to find a properly balanced JSON object
  let foundJson = false;
  let braceCount = 0;
  let startIndex = -1;
  let endIndex = -1;
  
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (cleaned[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex >= 0) {
        endIndex = i;
        foundJson = true;
        break;
      }
    }
  }
  
  if (foundJson && startIndex >= 0 && endIndex > startIndex) {
    jsonResult = cleaned.substring(startIndex, endIndex + 1);
  } else {
    // Fallback: simple brace matching
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonResult = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      throw new Error('No JSON object found in response');
    }
  }
  
  // Step 6: Validate that we have a reasonable JSON structure
  if (!jsonResult.includes(':') || !jsonResult.includes('"')) {
    throw new Error('Invalid JSON structure detected');
  }
  
  // Step 7: Final cleanup
  jsonResult = jsonResult.trim();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Extracted JSON:', jsonResult.substring(0, 200));
  }
  
  return jsonResult;
}

// Legacy prompts (will be replaced by prompts.ts)
import { DEFAULT_QUESTIONS_PROMPT, DEFAULT_FOLLOWUP_PROMPT, SIMULATION_START_PROMPT, SIMULATION_TURN_PROMPT } from './prompts';

export const SYSTEM_PROMPTS = {
  QUESTIONS_GENERATION: DEFAULT_QUESTIONS_PROMPT,
  FOLLOWUP_GENERATION: DEFAULT_FOLLOWUP_PROMPT,
  SIMULATION_START: SIMULATION_START_PROMPT,
  SIMULATION_TURN: SIMULATION_TURN_PROMPT
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

export function createSimulationStartPrompt(topic: string): string {
  return `【テーマ】: ${topic}

上記のテーマについて、記者会見での最初の質問を生成してください。`;
}

export function createSimulationTurnPrompt(lastQuestion: string, userAnswer: string): string {
  return `【前回の質問】: ${lastQuestion}
【広報回答】: ${userAnswer}

上記の質問と回答を踏まえて、次の追随質問を生成してください。`;
}