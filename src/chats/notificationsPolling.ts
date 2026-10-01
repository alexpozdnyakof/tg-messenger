import {
  deleteNotification,
  receiveNotification,
  setSettings,
  type GreenApiCredentials,
} from '@/api/greenApiClient'
import { useAuthStore } from '@/auth/authStore'
import { handleGreenApiAuthError } from '@/auth/handleGreenApiAuthError'
import { useMessagesStore } from '@/chats/messagesStore'

const POLL_INTERVAL_MS = 3000

function startPolling(credentials: GreenApiCredentials): () => void {
  let stopped = false
  let timeoutId: ReturnType<typeof setTimeout>

  async function poll() {
    if (stopped) return

    // Every awaited call here already turns its own failures (network,
    // malformed body) into an `ok: false` result instead of throwing — but
    // the catch is a last-resort belt-and-suspenders: nothing should ever be
    // able to kill this loop silently.
    let hadNotification = false
    try {
      const result = await receiveNotification(credentials)
      hadNotification = result.ok && result.notification !== null

      if (result.ok && result.notification) {
        const { receiptId, chatId, text } = result.notification
        if (chatId && text) {
          useMessagesStore
            .getState()
            .addMessage(chatId, { id: String(receiptId), author: 'them', text })
        }
        await deleteNotification(credentials, receiptId)
      } else if (!result.ok) {
        // Bad credentials mid-session (instance deauthorized, token
        // revoked) — without this the loop would otherwise hit 401/403
        // forever in the background with zero feedback to the user, since
        // nothing else is driving this poll. Logging out stops it (the
        // `credentials` change unsubscribes this loop) and kicks the user
        // back to /login.
        handleGreenApiAuthError(result.error)
      }
    } catch {
      hadNotification = false
    }

    // Drain a backlog immediately (another notification may already be
    // queued); only idle at the full interval once the queue is empty.
    if (!stopped) {
      timeoutId = setTimeout(poll, hadNotification ? 0 : POLL_INTERVAL_MS)
    }
  }

  setSettings(credentials)
  poll()

  return () => {
    stopped = true
    clearTimeout(timeoutId)
  }
}

// Background service tied to auth state, not to any component's lifecycle —
// runs once at app bootstrap (see main.tsx) and restarts the poll loop
// whenever credentials change (login/logout), no React involved.
export function initNotificationsPolling() {
  let stop: (() => void) | null = null

  function sync(credentials: GreenApiCredentials | null) {
    stop?.()
    stop = credentials ? startPolling(credentials) : null
  }

  sync(useAuthStore.getState().credentials)
  useAuthStore.subscribe((state, prevState) => {
    if (state.credentials !== prevState.credentials) {
      sync(state.credentials)
    }
  })
}
