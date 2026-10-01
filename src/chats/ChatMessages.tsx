import { cn } from 'cn'

export type ChatMessage = {
  id: string
  author: 'me' | 'them'
  text: string
}

type ChatMessagesProps = {
  messages: ChatMessage[]
}

function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Нет сообщений</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'max-w-[70%] rounded-2xl px-3 py-2 text-sm break-words',
                message.author === 'me'
                  ? 'self-end rounded-br-sm bg-primary text-primary-foreground'
                  : 'self-start rounded-bl-sm bg-muted text-foreground',
              )}
            >
              {message.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatMessages
