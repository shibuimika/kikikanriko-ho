'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChatStore, useChatActions, useChatData } from '@/lib/stores/chatStore';

export default function SimulatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');
  
  const { topic: currentTopic, messages, isLoading, hasMessages } = useChatData();
  const { initializeChat, addMessage, setLoading, getLastReporterQuestion } = useChatActions();
  
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期化
  useEffect(() => {
    if (topic && !isInitialized) {
      initializeChat(topic);
      startSimulation(topic);
      setIsInitialized(true);
    } else if (!topic) {
      router.push('/');
    }
  }, [topic, isInitialized, initializeChat, router]);

  // 初回質問の取得
  const startSimulation = async (topicText: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/simulate/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topicText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'サーバーエラーが発生しました');
      }

      const data = await response.json();
      addMessage('reporter', data.next_question);
    } catch (error) {
      console.error('Error starting simulation:', error);
      setError(error instanceof Error ? error.message : 'シミュレーション開始に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ユーザー回答の送信
  const sendAnswer = async () => {
    if (!userInput.trim()) {
      setError('回答を入力してください');
      return;
    }

    const lastQuestion = getLastReporterQuestion();
    if (!lastQuestion) {
      setError('記者の質問がありません');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ユーザーの回答を追加
      addMessage('user', userInput.trim());
      const currentInput = userInput.trim();
      setUserInput('');

      // 次の質問を取得
      const response = await fetch('/api/simulate/turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastQuestion,
          userAnswer: currentInput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'サーバーエラーが発生しました');
      }

      const data = await response.json();
      addMessage('reporter', data.next_question);
    } catch (error) {
      console.error('Error sending answer:', error);
      setError(error instanceof Error ? error.message : '回答送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Enterキーでの送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">記者会見シミュレーション</h1>
              <p className="text-sm text-gray-600 mt-1">
                テーマ: {currentTopic || topic}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← 戻る
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {hasMessages ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">
                      {message.role === 'user' ? 'あなた（広報担当）' : '記者'}
                    </div>
                    <div className="whitespace-pre-wrap">{message.text}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-12">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    記者の質問を生成中...
                  </div>
                ) : (
                  '記者の質問をお待ちください'
                )}
              </div>
            )}
            
            {isLoading && hasMessages && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-3xl px-4 py-3 rounded-lg">
                  <div className="text-xs font-medium mb-1">記者</div>
                  <div className="flex items-center">
                    <svg className="animate-spin h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    次の質問を考えています...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-6 py-2">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-4">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="記者の質問に回答してください... (Shift+Enterで改行、Enterで送信)"
                className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
                rows={3}
                disabled={isLoading || !hasMessages}
              />
              <button
                onClick={sendAnswer}
                disabled={isLoading || !userInput.trim() || !hasMessages}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isLoading ? '送信中...' : '回答'}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Shift+Enterで改行、Enterで送信
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}