import type { GreenApiAuthError } from '@/api/greenApiClient'
import { useAuthStore } from '@/auth/authStore'

// Centralizes what happens when a GREEN-API call reports bad credentials
// mid-session (instance deauthorized in the GREEN-API cabinet, token
// revoked, etc.): log out — which kicks the user back to /login via
// App.tsx's existing guard — and return a message explaining why, instead
// of treating it the same as a transient "service unavailable" failure.
export function handleGreenApiAuthError(error: GreenApiAuthError): string {
  switch (error.type) {
    case 'invalidIdInstance':
    case 'invalidApiTokenInstance':
      useAuthStore.getState().logout()
      return 'Сессия недействительна, войдите заново'
    case 'serviceUnavailable':
      return 'Сервис GREEN-API недоступен, попробуйте позже'
  }
}
