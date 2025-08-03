import { create } from 'zustand';

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
  
  // アクション
  initializeChat: (topic: string) => void;
  addMessage: (role: 'reporter' | 'user', text: string) => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
  
  // ゲッター
  getLastReporterQuestion: () => string | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // 初期状態
  topic: '',
  messages: [],
  isLoading: false,

  // チャット初期化
  initializeChat: (topic: string) => {
    set({
      topic,
      messages: [],
      isLoading: false
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
      isLoading: false
    });
  },

  // 最後の記者質問を取得
  getLastReporterQuestion: () => {
    const state = get();
    const reporterMessages = state.messages.filter(msg => msg.role === 'reporter');
    return reporterMessages.length > 0 
      ? reporterMessages[reporterMessages.length - 1].text 
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
    getLastReporterQuestion
  } = useChatStore();
  
  return {
    initializeChat,
    addMessage,
    setLoading,
    clearChat,
    getLastReporterQuestion
  };
};

export const useChatData = () => {
  const { topic, messages, isLoading } = useChatStore();
  
  return {
    topic,
    messages,
    isLoading,
    hasMessages: messages.length > 0
  };
};