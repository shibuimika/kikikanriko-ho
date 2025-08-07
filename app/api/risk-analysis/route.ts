import { NextRequest, NextResponse } from 'next/server';
import { callQwen3 } from '@/lib/llm';
import { validateOrRetry } from '@/lib/validators';
import { RiskAnalysisSchema, RiskAnalysisResponse } from '@/lib/schemas';
import { RISK_SYSTEM_PROMPT } from '@/lib/prompts';
import { logger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  const requestId = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Risk analysis request received', { request_id: requestId });
    
    const body = await request.json();
    const { question, userAnswer } = body;

    if (!question || !userAnswer) {
      return NextResponse.json(
        { error: 'question and userAnswer are required' },
        { status: 400 }
      );
    }

    // プロンプト構築
    const userPrompt = `【記者質問】: ${question}
【広報回答】: ${userAnswer}`;

    logger.info('Calling LLM for risk analysis', { 
      request_id: requestId,
      question_length: question.length,
      answer_length: userAnswer.length
    });

    // LLM呼び出し用のリトライ関数
    const retryLLMCall = async () => {
      const response = await callQwen3({
        systemPrompt: RISK_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.3,
        maxTokens: 1500
      });
      return response.content;
    };

    // 初期レスポンス取得
    const initialResponse = await retryLLMCall();

    // バリデーション付きでレスポンス処理
    const result = await validateOrRetry<RiskAnalysisResponse>(
      RiskAnalysisSchema,
      initialResponse,
      retryLLMCall,
      2 // 最大2回リトライ
    );

    logger.info('Risk analysis completed successfully', {
      request_id: requestId,
      risks_count: result.risks.length,
      high_risks: result.risks.filter(r => r.severity === 'high').length,
      medium_risks: result.risks.filter(r => r.severity === 'medium').length,
      low_risks: result.risks.filter(r => r.severity === 'low').length
    });

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Risk analysis failed', {
      request_id: requestId,
      error: errorMessage,
      stack: errorStack
    });

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { 
          error: 'AI応答の形式が正しくありません。もう一度お試しください。',
          details: error.message 
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        error: 'リスク分析の処理中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}