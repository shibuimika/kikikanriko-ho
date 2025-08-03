import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '@/lib/logging';

// セキュリティ: 開発環境でのみファイル書き込みを許可
const isDevelopment = process.env.NODE_ENV === 'development';

interface UpdatePromptsRequest {
  questionsPrompt?: string;
  followupPrompt?: string;
}

export async function POST(request: NextRequest) {
  const requestId = `upd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // セキュリティチェック: 開発環境のみ許可
    if (!isDevelopment) {
      logger.warn('File update attempted in production', {
        request_id: requestId,
        route: '/api/update-prompts'
      });
      return NextResponse.json(
        { error: '本番環境ではプロンプトファイルの更新はできません' },
        { status: 403 }
      );
    }

    const body: UpdatePromptsRequest = await request.json();
    const { questionsPrompt, followupPrompt } = body;

    if (!questionsPrompt && !followupPrompt) {
      return NextResponse.json(
        { error: '更新するプロンプトが指定されていません' },
        { status: 400 }
      );
    }

    logger.info('Starting prompt file update', {
      request_id: requestId,
      route: '/api/update-prompts',
      has_questions_prompt: !!questionsPrompt,
      has_followup_prompt: !!followupPrompt
    });

    // ファイルパスを解決
    const promptsFilePath = join(process.cwd(), 'lib', 'prompts.ts');
    
    // 現在のファイル内容を読み取り
    const currentContent = await readFile(promptsFilePath, 'utf-8');
    
    // バックアップファイルを作成
    const backupPath = join(process.cwd(), 'lib', `prompts.backup.${Date.now()}.ts`);
    await writeFile(backupPath, currentContent, 'utf-8');
    
    logger.info('Created backup file', {
      request_id: requestId,
      backup_path: backupPath
    });

    // 新しいファイル内容を生成
    let newContent = generateNewPromptsFile(
      questionsPrompt,
      followupPrompt,
      currentContent
    );

    // ファイルを更新
    await writeFile(promptsFilePath, newContent, 'utf-8');

    logger.info('Prompt file updated successfully', {
      request_id: requestId,
      route: '/api/update-prompts',
      backup_created: backupPath,
      outcome: 'success'
    });

    return NextResponse.json({
      success: true,
      message: 'プロンプトファイルが正常に更新されました',
      backupPath
    });

  } catch (error) {
    logger.error('Prompt file update failed', {
      request_id: requestId,
      route: '/api/update-prompts',
      error: error instanceof Error ? error.message : 'Unknown error',
      outcome: 'error'
    });

    return NextResponse.json(
      { error: 'ファイルの更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

function generateNewPromptsFile(
  questionsPrompt?: string,
  followupPrompt?: string,
  currentContent?: string
): string {
  // 現在のファイルから既存のプロンプトを抽出（フォールバック用）
  const extractCurrentPrompt = (type: 'QUESTIONS' | 'FOLLOWUP') => {
    if (!currentContent) return '';
    
    const pattern = type === 'QUESTIONS' 
      ? /export const DEFAULT_QUESTIONS_PROMPT = `([^`]*)`/s
      : /export const DEFAULT_FOLLOWUP_PROMPT = `([^`]*)`/s;
    
    const match = currentContent.match(pattern);
    return match ? match[1] : '';
  };

  const finalQuestionsPrompt = questionsPrompt || extractCurrentPrompt('QUESTIONS');
  const finalFollowupPrompt = followupPrompt || extractCurrentPrompt('FOLLOWUP');

  // エスケープ処理（バッククォート内の特殊文字）
  const escapePrompt = (prompt: string) => {
    return prompt.replace(/`/g, '\\`').replace(/\${/g, '\\${');
  };

  return `// Default System Prompts for the Crisis Management AI App
// Last updated: ${new Date().toISOString()}

export const DEFAULT_QUESTIONS_PROMPT = \`${escapePrompt(finalQuestionsPrompt)}\`;

export const DEFAULT_FOLLOWUP_PROMPT = \`${escapePrompt(finalFollowupPrompt)}\`;

export const PROMPT_DESCRIPTIONS = {
  QUESTIONS_GENERATION: {
    title: '想定質問生成プロンプト',
    description: '記者からの想定質問を生成するためのシステムプロンプトです。',
    defaultValue: DEFAULT_QUESTIONS_PROMPT
  },
  FOLLOWUP_GENERATION: {
    title: '追随質問生成プロンプト', 
    description: '広報回答に対する追随質問を生成するためのシステムプロンプトです。',
    defaultValue: DEFAULT_FOLLOWUP_PROMPT
  }
} as const;

export type PromptType = keyof typeof PROMPT_DESCRIPTIONS;
`;
}