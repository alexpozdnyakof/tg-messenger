import { cn } from 'cn'
import { LogOutIcon } from 'lucide-react'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/auth/authStore'
import { useChatsStore } from '@/chats/chatsStore'
import NewChatDialog from '@/chats/NewChatDialog'
import { Button } from '@/lib/ui/button'

function ChatsList() {
  const logout = useAuthStore((state) => state.logout)
  const chats = useChatsStore((state) => state.chats)
  const [location, navigate] = useLocation()

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
            {chats.map((chat) => {
              const isActive = location === `/${chat.chatId}`
              return (
                <li key={chat.chatId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/${chat.chatId}`)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive &&
                        'bg-sidebar-accent text-sidebar-accent-foreground',
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {chat.title.replace('@', '').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="truncate">{chat.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ChatsList
