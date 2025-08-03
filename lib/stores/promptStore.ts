import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  DEFAULT_QUESTIONS_PROMPT, 
  DEFAULT_FOLLOWUP_PROMPT, 
  PromptType 
} from '@/lib/prompts';

interface PromptState {
  // カスタムプロンプト
  customQuestionPrompt: string;
  customFollowupPrompt: string;
  
  // 設定状態
  isSettingsOpen: boolean;
  
  // ファイル同期状態
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string;
  lastSyncTime: string | null;
  
  // アクション
  setCustomQuestionPrompt: (prompt: string) => void;
  setCustomFollowupPrompt: (prompt: string) => void;
  resetPrompt: (type: PromptType) => void;
  resetAllPrompts: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  
  // ファイル同期アクション
  syncToFile: () => Promise<void>;
  clearSyncStatus: () => void;
  
  // ゲッター
  getPrompt: (type: PromptType) => string;
  isUsingCustomPrompt: (type: PromptType) => boolean;
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      // 初期状態
      customQuestionPrompt: '',
      customFollowupPrompt: '',
      isSettingsOpen: false,
      
      // ファイル同期状態
      syncStatus: 'idle',
      syncMessage: '',
      lastSyncTime: null,

      // プロンプト設定アクション
      setCustomQuestionPrompt: (prompt: string) => 
        set({ customQuestionPrompt: prompt }),
      
      setCustomFollowupPrompt: (prompt: string) => 
        set({ customFollowupPrompt: prompt }),

      resetPrompt: (type: PromptType) => {
        if (type === 'QUESTIONS_GENERATION') {
          set({ customQuestionPrompt: '' });
        } else if (type === 'FOLLOWUP_GENERATION') {
          set({ customFollowupPrompt: '' });
        }
      },

      resetAllPrompts: () => 
        set({ 
          customQuestionPrompt: '', 
          customFollowupPrompt: '' 
        }),

      // モーダル制御
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),

      // ファイル同期機能
      syncToFile: async () => {
        const state = get();
        
        // カスタムプロンプトが設定されていない場合はスキップ
        if (!state.customQuestionPrompt && !state.customFollowupPrompt) {
          set({ 
            syncStatus: 'error', 
            syncMessage: 'カスタムプロンプトが設定されていません' 
          });
          return;
        }

        set({ syncStatus: 'syncing', syncMessage: 'ファイルを更新中...' });

        try {
          const response = await fetch('/api/update-prompts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              questionsPrompt: state.customQuestionPrompt || undefined,
              followupPrompt: state.customFollowupPrompt || undefined,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '更新に失敗しました');
          }

          const result = await response.json();
          
          set({ 
            syncStatus: 'success', 
            syncMessage: result.message || 'ファイルが正常に更新されました',
            lastSyncTime: new Date().toISOString()
          });

          // 3秒後にステータスをリセット
          setTimeout(() => {
            set({ syncStatus: 'idle', syncMessage: '' });
          }, 3000);

        } catch (error) {
          set({ 
            syncStatus: 'error', 
            syncMessage: error instanceof Error ? error.message : 'ファイル更新に失敗しました'
          });
        }
      },

      clearSyncStatus: () => set({ 
        syncStatus: 'idle', 
        syncMessage: '' 
      }),

      // ゲッター関数
      getPrompt: (type: PromptType) => {
        const state = get();
        if (type === 'QUESTIONS_GENERATION') {
          return state.customQuestionPrompt || DEFAULT_QUESTIONS_PROMPT;
        } else if (type === 'FOLLOWUP_GENERATION') {
          return state.customFollowupPrompt || DEFAULT_FOLLOWUP_PROMPT;
        }
        return DEFAULT_QUESTIONS_PROMPT;
      },

      isUsingCustomPrompt: (type: PromptType) => {
        const state = get();
        if (type === 'QUESTIONS_GENERATION') {
          return state.customQuestionPrompt.length > 0;
        } else if (type === 'FOLLOWUP_GENERATION') {
          return state.customFollowupPrompt.length > 0;
        }
        return false;
      }
    }),
    {
      name: 'crisis-ai-prompts', // localStorage key
      // カスタムプロンプトと同期情報のみ永続化（UI状態は除外）
      partialize: (state) => ({
        customQuestionPrompt: state.customQuestionPrompt,
        customFollowupPrompt: state.customFollowupPrompt,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// 便利なセレクター
export const useCustomPrompts = () => {
  const { 
    customQuestionPrompt, 
    customFollowupPrompt,
    getPrompt,
    isUsingCustomPrompt 
  } = usePromptStore();
  
  return {
    customQuestionPrompt,
    customFollowupPrompt,
    getQuestionPrompt: () => getPrompt('QUESTIONS_GENERATION'),
    getFollowupPrompt: () => getPrompt('FOLLOWUP_GENERATION'),
    isUsingCustomQuestionPrompt: () => isUsingCustomPrompt('QUESTIONS_GENERATION'),
    isUsingCustomFollowupPrompt: () => isUsingCustomPrompt('FOLLOWUP_GENERATION'),
  };
};

// ファイル同期機能専用セレクター
export const useFileSyncFeatures = () => {
  const {
    syncStatus,
    syncMessage,
    lastSyncTime,
    syncToFile,
    clearSyncStatus
  } = usePromptStore();

  return {
    syncStatus,
    syncMessage,
    lastSyncTime,
    syncToFile,
    clearSyncStatus,
    canSync: syncStatus === 'idle' || syncStatus === 'error',
    isLoading: syncStatus === 'syncing'
  };
};