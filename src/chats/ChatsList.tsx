import { LogOutIcon } from 'lucide-react'
import { useAuthStore } from '@/auth/authStore'
import ChatListItem from '@/chats/ChatListItem'
import { useChatsStore } from '@/chats/chatsStore'
import NewChatDialog from '@/chats/NewChatDialog'
import { Button } from '@/lib/ui/button'

function ChatsList() {
  const logout = useAuthStore((state) => state.logout)
  const chats = useChatsStore((state) => state.chats)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-3 py-2.5">
        <h1 className="font-heading text-base font-medium">Чаты</h1>
        <div className="flex items-center gap-1">
          <NewChatDialog />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            aria-label="Выйти"
            title="Выйти"
          >
            <LogOutIcon />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Пока нет ни одного чата
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 p-2">
            {chats.map((chat) => (
              <ChatListItem key={chat.chatId} chat={chat} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ChatsList
