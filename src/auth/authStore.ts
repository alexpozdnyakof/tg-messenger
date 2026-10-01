import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GreenApiCredentials } from '@/api/greenApiClient'
import { useChatsStore } from '@/chats/chatsStore'
import { useMessagesStore } from '@/chats/messagesStore'

type AuthState = {
  credentials: GreenApiCredentials | null
  login: (credentials: GreenApiCredentials) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      credentials: null,
      login: (credentials) => set({ credentials }),
      // Chats/messages are scoped to one GREEN-API instance — wipe them on
      // logout so a different instance logging in on the same browser never
      // sees the previous session's chat list or history.
      logout: () => {
        set({ credentials: null })
        useChatsStore.getState().reset()
        useMessagesStore.getState().reset()
      },
    }),
    { name: 'greenapi-auth' },
  ),
)
