'use client';

import { useState, useEffect } from 'react';
import { usePromptStore, useFileSyncFeatures } from '@/lib/stores/promptStore';
import { PROMPT_DESCRIPTIONS, PromptType } from '@/lib/prompts';

export default function PromptSettingsModal() {
  const {
    customQuestionPrompt,
    customFollowupPrompt,
    setCustomQuestionPrompt,
    setCustomFollowupPrompt,
    resetPrompt,
    resetAllPrompts,
    closeSettings,
  } = usePromptStore();

  const [activeTab, setActiveTab] = useState<PromptType>('QUESTIONS_GENERATION');
  const [editingQuestionPrompt, setEditingQuestionPrompt] = useState(customQuestionPrompt);
  const [editingFollowupPrompt, setEditingFollowupPrompt] = useState(customFollowupPrompt);
  
  // ファイル同期機能
  const {
    syncStatus,
    syncMessage,
    lastSyncTime,
    syncToFile,
    clearSyncStatus,
    canSync,
    isLoading
  } = useFileSyncFeatures();

  // Initialize editing state when modal opens
  useEffect(() => {
    setEditingQuestionPrompt(customQuestionPrompt);
    setEditingFollowupPrompt(customFollowupPrompt);
  }, [customQuestionPrompt, customFollowupPrompt]);

  const handleSave = () => {
    setCustomQuestionPrompt(editingQuestionPrompt);
    setCustomFollowupPrompt(editingFollowupPrompt);
    closeSettings();
  };

  const handleSyncToFile = async () => {
    // 先に現在の編集内容を保存
    setCustomQuestionPrompt(editingQuestionPrompt);
    setCustomFollowupPrompt(editingFollowupPrompt);
    
    // ファイル同期を実行
    await syncToFile();
  };

  const handleReset = (type: PromptType) => {
    if (type === 'QUESTIONS_GENERATION') {
      setEditingQuestionPrompt('');
      setCustomQuestionPrompt('');
    } else {
      setEditingFollowupPrompt('');
      setCustomFollowupPrompt('');
    }
  };

  const handleResetAll = () => {
    setEditingQuestionPrompt('');
    setEditingFollowupPrompt('');
    resetAllPrompts();
  };

  const getCurrentEditingPrompt = () => {
    if (activeTab === 'QUESTIONS_GENERATION') {
      return editingQuestionPrompt || PROMPT_DESCRIPTIONS.QUESTIONS_GENERATION.defaultValue;
    } else {
      return editingFollowupPrompt || PROMPT_DESCRIPTIONS.FOLLOWUP_GENERATION.defaultValue;
    }
  };

  const setCurrentEditingPrompt = (value: string) => {
    if (activeTab === 'QUESTIONS_GENERATION') {
      setEditingQuestionPrompt(value);
    } else {
      setEditingFollowupPrompt(value);
    }
  };

  const isUsingDefault = () => {
    if (activeTab === 'QUESTIONS_GENERATION') {
      return !editingQuestionPrompt;
    } else {
      return !editingFollowupPrompt;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              プロンプト設定
            </h2>
            {/* Sync Status */}
            {syncStatus !== 'idle' && (
              <div className={`mt-1 text-sm flex items-center ${
                syncStatus === 'success' ? 'text-green-600' :
                syncStatus === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {syncMessage}
              </div>
            )}
            {lastSyncTime && syncStatus === 'idle' && (
              <div className="mt-1 text-xs text-gray-500">
                最終同期: {new Date(lastSyncTime).toLocaleString('ja-JP')}
              </div>
            )}
          </div>
          <button
            onClick={closeSettings}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          {Object.entries(PROMPT_DESCRIPTIONS).map(([key, desc]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as PromptType)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {desc.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            {/* Description */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                {PROMPT_DESCRIPTIONS[activeTab].description}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">状態:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isUsingDefault() 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isUsingDefault() ? 'デフォルト使用' : 'カスタム使用'}
                </span>
              </div>
              
              <button
                onClick={() => handleReset(activeTab)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                デフォルトに戻す
              </button>
            </div>

            {/* Prompt Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロンプト内容
              </label>
              <textarea
                value={getCurrentEditingPrompt()}
                onChange={(e) => setCurrentEditingPrompt(e.target.value)}
                className="w-full h-96 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900 placeholder-gray-400"
                placeholder={`${PROMPT_DESCRIPTIONS[activeTab].title}を入力してください...`}
              />
              <p className="mt-1 text-xs text-gray-500">
                {getCurrentEditingPrompt().length} 文字
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetAll}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              すべてリセット
            </button>
            
            {/* File Sync Button */}
            <button
              onClick={handleSyncToFile}
              disabled={!canSync}
              className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
                canSync
                  ? 'text-purple-600 border-purple-300 hover:bg-purple-50'
                  : 'text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
              title="現在のプロンプト設定をファイルに保存します（開発環境のみ）"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                ファイルに同期
              </div>
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={closeSettings}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}