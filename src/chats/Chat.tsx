import { useState } from 'react'
import { sendMessage } from '@/api/greenApiClient'
import { useAuthStore } from '@/auth/authStore'
import ChatMessages, { type ChatMessage } from '@/chats/ChatMessages'
import MessageForm from '@/chats/MessageForm'

type ChatProps = {
  chatId: string
}

function Chat({ chatId }: ChatProps) {
  const credentials = useAuthStore((state) => state.credentials)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  async function handleSend(text: string) {
    if (!credentials) {
      throw new Error('Нет активной сессии')
    }

    const result = await sendMessage(credentials, { chatId, message: text })
    if (!result.ok) {
      throw new Error('Не удалось отправить сообщение, попробуйте ещё раз')
    }

    setMessages((prev) => [
      ...prev,
      { id: result.idMessage, author: 'me', text },
    ])
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatMessages messages={messages} />
      <MessageForm onSend={handleSend} />
    </div>
  )
}

export default Chat
