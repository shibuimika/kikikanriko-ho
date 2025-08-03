import { NextRequest, NextResponse } from 'next/server';
import { callQwen3, SYSTEM_PROMPTS, createQuestionsPrompt, extractJSON } from '@/lib/llm';
import { validateOrRetry } from '@/lib/validators';
import { QuestionsSchema, QuestionsResponse } from '@/lib/schemas';
import { DEFAULT_QUESTIONS_PROMPT } from '@/lib/prompts';
import { logger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  const requestId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = await request.json();
    const { topic, context, customPrompt } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'テーマが必要です' },
        { status: 400 }
      );
    }

    // Use custom prompt if provided, otherwise use default
    const systemPrompt = customPrompt && customPrompt.trim() 
      ? customPrompt.trim() 
      : DEFAULT_QUESTIONS_PROMPT;

    logger.info('Starting question generation', {
      route: '/api/generate-questions',
      request_id: requestId,
      topic_length: topic.length,
      has_context: !!context,
      has_custom_prompt: !!customPrompt,
      custom_prompt_length: customPrompt?.length || 0
    });

    const userPrompt = createQuestionsPrompt(topic.trim(), context?.trim());
    
    // Create retry function for validation
    const retryLLMCall = async () => {
      const response = await callQwen3({
        systemPrompt,
        userPrompt,
        temperature: 0.3,
        maxTokens: 2000
      });
      // Extract JSON from response content
      return extractJSON(response.content);
    };

    // Get initial response
    const initialResponse = await retryLLMCall();

    // Validate with auto-retry
    const validatedResponse = await validateOrRetry<QuestionsResponse>(
      QuestionsSchema,
      initialResponse,
      retryLLMCall,
      2 // max 2 retries
    );

    logger.info('Question generation successful', {
      route: '/api/generate-questions',
      request_id: requestId,
      questions_count: validatedResponse.questions.length,
      outcome: 'success'
    });

    return NextResponse.json(validatedResponse);

  } catch (error) {
    logger.error('Question generation failed', {
      route: '/api/generate-questions',
      request_id: requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      outcome: 'error'
    });

    // Return user-friendly error message
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        { error: 'AI応答の形式が正しくありません。再試行してください。' },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。再試行してください。' },
      { status: 500 }
    );
  }
}