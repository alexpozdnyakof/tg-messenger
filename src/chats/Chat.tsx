import { useEffect, useState } from 'react'
import { getChatHistory, sendMessage } from '@/api/greenApiClient'
import { useAuthStore } from '@/auth/authStore'
import { handleGreenApiAuthError } from '@/auth/handleGreenApiAuthError'
import ChatMessages, { type ChatMessage } from '@/chats/ChatMessages'
import MessageForm from '@/chats/MessageForm'
import { useMessagesStore } from '@/chats/messagesStore'

type ChatProps = {
  chatId: string
}

const EMPTY_MESSAGES: ChatMessage[] = []

function Chat({ chatId }: ChatProps) {
  const credentials = useAuthStore((state) => state.credentials)
  const messages = useMessagesStore(
    (state) => state.messagesByChatId[chatId] ?? EMPTY_MESSAGES,
  )
  const hasHistory = useMessagesStore(
    (state) => chatId in state.messagesByChatId,
  )
  const setMessages = useMessagesStore((state) => state.setMessages)
  const addMessage = useMessagesStore((state) => state.addMessage)
  const [historyError, setHistoryError] = useState<{
    chatId: string
    message: string
  }>()

  // Нет своей БД — прошлая переписка хранится только на сервере GREEN-API.
  // Подтягиваем её один раз при первом открытии чата, дальше отправленные
  // и принятые сообщения просто дописываются в реальном времени.
  useEffect(() => {
    if (hasHistory || !credentials) return

    // getChatHistory dedupes identical in-flight requests itself (see
    // greenApiClient.ts), so this effect doesn't need to track "is this
    // chat's history already loading" — React StrictMode's double-invoke
    // just calls it twice and gets back the same shared result both times.
    getChatHistory(credentials, chatId).then((result) => {
      if (result.ok) {
        setMessages(chatId, result.messages)
        setHistoryError(undefined)
      } else {
        setHistoryError({
          chatId,
          message: handleGreenApiAuthError(result.error),
        })
      }
    })
  }, [chatId, hasHistory, credentials, setMessages])

  const currentHistoryError =
    historyError?.chatId === chatId ? historyError.message : undefined

  async function handleSend(text: string) {
    if (!credentials) {
      throw new Error('Нет активной сессии')
    }

    const result = await sendMessage(credentials, { chatId, message: text })
    if (!result.ok) {
      throw new Error(handleGreenApiAuthError(result.error))
    }

    addMessage(chatId, { id: result.idMessage, author: 'me', text })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatMessages
        messages={messages}
        isLoading={!hasHistory && !currentHistoryError}
      />
      {currentHistoryError && (
        <p className="px-4 pb-2 text-sm text-destructive">
          {currentHistoryError}
        </p>
      )}
      <MessageForm key={chatId} onSend={handleSend} />
    </div>
  )
}

export default Chat
