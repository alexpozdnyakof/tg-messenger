import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Chat = {
  chatId: string
  title: string
}

type ChatsState = {
  chats: Chat[]
  addChat: (chat: Chat) => void
}

export const useChatsStore = create<ChatsState>()(
  persist(
    (set, get) => ({
      chats: [],
      addChat: (chat) => {
        if (get().chats.some((existing) => existing.chatId === chat.chatId)) {
          return
        }
        set({ chats: [chat, ...get().chats] })
      },
    }),
    { name: 'greenapi-chats' },
  ),
)
