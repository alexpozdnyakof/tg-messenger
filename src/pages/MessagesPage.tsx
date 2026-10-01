import Chat from '@/chats/Chat'
import ChatsList from '@/chats/ChatsList'

type MessagesPageProps = {
  chatId?: string
}

function MessagesPage({ chatId }: MessagesPageProps) {
  return (
    <div className="grid h-dvh grid-cols-12">
      <aside className="col-span-3 h-full overflow-hidden border-r border-sidebar-border">
        <ChatsList />
      </aside>
      <main className="col-span-9 flex h-full min-h-0 flex-col">
        {chatId ? (
          <Chat key={chatId} chatId={chatId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Выберите чат слева</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default MessagesPage
