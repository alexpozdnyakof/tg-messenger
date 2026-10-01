import { create } from 'zustand'
import type { ChatMessage } from '@/chats/ChatMessages'

type MessagesState = {
  messagesByChatId: Record<string, ChatMessage[]>
  setMessages: (chatId: string, messages: ChatMessage[]) => void
  addMessage: (chatId: string, message: ChatMessage) => void
  reset: () => void
}

export const useMessagesStore = create<MessagesState>()((set, get) => ({
  messagesByChatId: {},
  setMessages: (chatId, messages) => {
    set({ messagesByChatId: { ...get().messagesByChatId, [chatId]: messages } })
  },
  addMessage: (chatId, message) => {
    const existing = get().messagesByChatId[chatId] ?? []
    set({
      messagesByChatId: { ...get().messagesByChatId, [chatId]: [...existing, message] },
    })
  },
  reset: () => set({ messagesByChatId: {} }),
}))
