'use client';

import { useState } from 'react';
import PromptForm from '@/components/PromptForm';
import QuestionsTable from '@/components/QuestionsTable';
import PromptSettingsModal from '@/components/PromptSettingsModal';
import { Question } from '@/lib/schemas';
import { usePromptStore } from '@/lib/stores/promptStore';

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { openSettings, isSettingsOpen } = usePromptStore();

  const handleQuestionsGenerated = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                危機管理広報AIアプリ
              </h1>
              <p className="mt-2 text-gray-600">
                炎上しそうなテーマから想定質問を生成し、記者とのシミュレーションを行います
              </p>
            </div>
            
            {/* Settings Button */}
            <button
              onClick={openSettings}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="プロンプト設定"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Phase 1: Topic Input and Question Generation */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              フェーズ1: 想定質問生成
            </h2>
            <PromptForm 
              onQuestionsGenerated={handleQuestionsGenerated}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </section>

          {/* Questions Results */}
          {questions.length > 0 && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                生成された想定質問 ({questions.length}件)
              </h2>
              <QuestionsTable questions={questions} />
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            危機管理広報AIアプリ - Powered by Qwen3
          </p>
        </div>
      </footer>

      {/* Prompt Settings Modal */}
      {isSettingsOpen && <PromptSettingsModal />}
    </div>
  );
}
