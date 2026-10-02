import {
  deleteNotification,
  receiveNotification,
  setSettings,
  type GreenApiCredentials,
} from "@/api/greenApiClient";
import { useAuthStore } from "@/auth/authStore";
import { handleGreenApiAuthError } from "@/auth/handleGreenApiAuthError";
import { useMessagesStore } from "@/chats/messagesStore";

const POLL_INTERVAL_MS = 3000;

function startPolling(credentials: GreenApiCredentials): () => void {
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  async function poll() {
    if (stopped) return;

    let hadNotification = false;
    try {
      const result = await receiveNotification(credentials);
      hadNotification = result.ok && result.notification !== null;

      if (result.ok && result.notification) {
        const { receiptId, chatId, text } = result.notification;
        if (chatId && text) {
          useMessagesStore
            .getState()
            .addMessage(chatId, {
              id: String(receiptId),
              author: "them",
              text,
            });
        }
        await deleteNotification(credentials, receiptId);
      } else if (!result.ok) {
        handleGreenApiAuthError(result.error);
      }
    } catch {
      hadNotification = false;
    }

    if (!stopped) {
      timeoutId = setTimeout(poll, hadNotification ? 0 : POLL_INTERVAL_MS);
    }
  }

  setSettings(credentials);
  poll();

  return () => {
    stopped = true;
    clearTimeout(timeoutId);
  };
}

export function initNotificationsPolling() {
  let stop: (() => void) | null = null;

  function sync(credentials: GreenApiCredentials | null) {
    stop?.();
    stop = credentials ? startPolling(credentials) : null;
  }

  sync(useAuthStore.getState().credentials);
  useAuthStore.subscribe((state, prevState) => {
    if (state.credentials !== prevState.credentials) {
      sync(state.credentials);
    }
  });
}
