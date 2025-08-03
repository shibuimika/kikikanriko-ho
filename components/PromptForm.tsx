'use client';

import { useState } from 'react';
import { Question } from '@/lib/schemas';
import { useCustomPrompts } from '@/lib/stores/promptStore';

interface PromptFormProps {
  onQuestionsGenerated: (questions: Question[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function PromptForm({ onQuestionsGenerated, isLoading, setIsLoading }: PromptFormProps) {
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [error, setError] = useState('');
  const { getQuestionPrompt, isUsingCustomQuestionPrompt } = useCustomPrompts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('テーマを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const currentPrompt = getQuestionPrompt();
      
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          context: context.trim() || undefined,
          customPrompt: isUsingCustomQuestionPrompt() ? currentPrompt : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アプリで予期しないエラーが発生しました');
      }

      const data = await response.json();
      onQuestionsGenerated(data.questions);
    } catch (error) {
      console.error('Error generating questions:', error);
      setError(error instanceof Error ? error.message : 'アプリで予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Prompt Status Indicator */}
      {isUsingCustomQuestionPrompt() && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800 font-medium">
              カスタムプロンプトを使用中
            </span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Topic Input */}
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
          炎上テーマ <span className="text-red-500">*</span>
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="例: データ流出事件、SNS炎上、製品リコール など"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          maxLength={1000}
          disabled={isLoading}
        />
        <p className="mt-1 text-sm text-gray-500">
          {topic.length}/1000文字
        </p>
      </div>

      {/* Context Input */}
      <div>
        <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
          補足・背景情報（任意）
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="関連するURL、背景情報、既存報道など（任意）"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          maxLength={500}
          disabled={isLoading}
        />
        <p className="mt-1 text-sm text-gray-500">
          {context.length}/500文字
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              想定質問を生成中...
            </div>
          ) : (
            '想定質問を生成'
          )}
        </button>
      </div>
      </form>
    </div>
  );
}