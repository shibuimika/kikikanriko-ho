import { NextRequest, NextResponse } from 'next/server';
import { callQwen3, SYSTEM_PROMPTS, createSimulationTurnPrompt, extractJSON } from '@/lib/llm';
import { validateOrRetry } from '@/lib/validators';
import { SimulationTurnSchema, SimulationTurnResponse } from '@/lib/schemas';
import { logger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  const requestId = `sim_turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = await request.json();
    const { lastQuestion, userAnswer } = body;

    if (!lastQuestion || typeof lastQuestion !== 'string' || lastQuestion.trim().length === 0) {
      return NextResponse.json(
        { error: '前回の質問が必要です' },
        { status: 400 }
      );
    }

    if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim().length === 0) {
      return NextResponse.json(
        { error: 'ユーザーの回答が必要です' },
        { status: 400 }
      );
    }

    logger.info('Starting simulation turn', {
      route: '/api/simulate/turn',
      request_id: requestId,
      last_question_length: lastQuestion.length,
      user_answer_length: userAnswer.length
    });

    const systemPrompt = SYSTEM_PROMPTS.SIMULATION_TURN;
    const userPrompt = createSimulationTurnPrompt(lastQuestion.trim(), userAnswer.trim());
    
    // Create retry function for validation
    const retryLLMCall = async () => {
      const response = await callQwen3({
        systemPrompt,
        userPrompt,
        temperature: 0.3,
        maxTokens: 1000
      });
      // Extract JSON from response content
      return extractJSON(response.content);
    };

    // Get initial response
    const initialResponse = await retryLLMCall();

    logger.info('Raw LLM response for simulation turn', {
      route: '/api/simulate/turn',
      request_id: requestId,
      raw_response: initialResponse,
      response_length: initialResponse.length
    });

    // Validate with auto-retry
    const validatedResponse = await validateOrRetry<SimulationTurnResponse>(
      SimulationTurnSchema,
      initialResponse,
      retryLLMCall,
      2 // max 2 retries
    );

    logger.info('Simulation turn successful', {
      route: '/api/simulate/turn',
      request_id: requestId,
      question_length: validatedResponse.next_question.length,
      outcome: 'success'
    });

    return NextResponse.json(validatedResponse);

  } catch (error) {
    logger.error('Simulation turn failed', {
      route: '/api/simulate/turn',
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