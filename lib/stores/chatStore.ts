import { create } from 'zustand';
import { Risk } from '@/lib/schemas';

export interface ChatMessage {
  id: string;
  role: 'reporter' | 'user';
  text: string;
  timestamp: string;
}

interface ChatState {
  // チャットデータ
  topic: string;
  messages: ChatMessage[];
  isLoading: boolean;
  
  // リスク分析データ
  risks: Risk[];
  isAnalyzingRisk: boolean;
  
  // アクション
  initializeChat: (topic: string) => void;
  addMessage: (role: 'reporter' | 'user', text: string) => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
  
  // リスク分析アクション
  setRisks: (risks: Risk[]) => void;
  setAnalyzingRisk: (analyzing: boolean) => void;
  clearRisks: () => void;
  
  // ゲッター
  getLastReporterQuestion: () => string | null;
  getLastUserAnswer: () => string | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // 初期状態
  topic: '',
  messages: [],
  isLoading: false,
  
  // リスク分析初期状態
  risks: [],
  isAnalyzingRisk: false,

  // チャット初期化
  initializeChat: (topic: string) => {
    set({
      topic,
      messages: [],
      isLoading: false,
      risks: [],
      isAnalyzingRisk: false
    });
  },

  // メッセージ追加
  addMessage: (role: 'reporter' | 'user', text: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      text,
      timestamp: new Date().toISOString()
    };
    
    set(state => ({
      messages: [...state.messages, newMessage]
    }));
  },

  // ローディング状態設定
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // チャットクリア
  clearChat: () => {
    set({
      topic: '',
      messages: [],
      isLoading: false,
      risks: [],
      isAnalyzingRisk: false
    });
  },

  // リスク分析アクション
  setRisks: (risks: Risk[]) => {
    set({ risks });
  },

  setAnalyzingRisk: (analyzing: boolean) => {
    set({ isAnalyzingRisk: analyzing });
  },

  clearRisks: () => {
    set({ risks: [] });
  },

  // 最後の記者質問を取得
  getLastReporterQuestion: () => {
    const state = get();
    const reporterMessages = state.messages.filter(msg => msg.role === 'reporter');
    return reporterMessages.length > 0 
      ? reporterMessages[reporterMessages.length - 1].text 
      : null;
  },

  // 最後のユーザー回答を取得
  getLastUserAnswer: () => {
    const state = get();
    const userMessages = state.messages.filter(msg => msg.role === 'user');
    return userMessages.length > 0 
      ? userMessages[userMessages.length - 1].text 
      : null;
  }
}));

// 便利なセレクター
export const useChatActions = () => {
  const {
    initializeChat,
    addMessage,
    setLoading,
    clearChat,
    setRisks,
    setAnalyzingRisk,
    clearRisks,
    getLastReporterQuestion,
    getLastUserAnswer
  } = useChatStore();
  
  return {
    initializeChat,
    addMessage,
    setLoading,
    clearChat,
    setRisks,
    setAnalyzingRisk,
    clearRisks,
    getLastReporterQuestion,
    getLastUserAnswer
  };
};

export const useChatData = () => {
  const { topic, messages, isLoading, risks, isAnalyzingRisk } = useChatStore();
  
  return {
    topic,
    messages,
    isLoading,
    risks,
    isAnalyzingRisk,
    hasMessages: messages.length > 0,
    hasRisks: risks.length > 0
  };
};