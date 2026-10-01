import Chat from '@/chats/Chat'
import ChatsList from '@/chats/ChatsList'

type MessagesPageProps = {
  chatId?: string
}

function MessagesPage({ chatId }: MessagesPageProps) {
  return (
    <div className="flex h-dvh">
      <aside className="my-4 ml-4 w-[360px] shrink-0 overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <ChatsList />
      </aside>
      <main className="flex h-full min-h-0 flex-1 justify-center overflow-hidden">
        <div className="flex h-full min-h-0 w-[688px] max-w-full flex-col">
          {chatId ? (
            <Chat chatId={chatId} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Выберите чат слева</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default MessagesPage
