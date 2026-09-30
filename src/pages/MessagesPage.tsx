import { useAuthStore } from '@/auth/authStore'
import { useChatsStore } from '@/chats/chatsStore'
import NewChatDialog from '@/chats/NewChatDialog'
import { Button } from '@/lib/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card'

function MessagesPage() {
  const logout = useAuthStore((state) => state.logout)
  const chats = useChatsStore((state) => state.chats)

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="flex h-full w-full max-w-5xl flex-col">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Чаты</CardTitle>
          <div className="flex items-center gap-2">
            <NewChatDialog />
            <Button variant="outline" onClick={logout}>
              Выйти
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {chats.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <p className="text-muted-foreground">Пока нет ни одного чата</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {chats.map((chat) => (
                <li
                  key={chat.chatId}
                  className="rounded-lg px-2.5 py-2 hover:bg-muted"
                >
                  {chat.title}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MessagesPage
