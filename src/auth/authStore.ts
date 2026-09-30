import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GreenApiCredentials } from '@/api/greenApiClient'

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
      logout: () => set({ credentials: null }),
    }),
    { name: 'greenapi-auth' },
  ),
)
