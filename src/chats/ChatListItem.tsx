import { cn } from 'cn'
import { memo } from 'react'
import { navigate } from 'wouter/use-browser-location'
import type { Chat } from '@/chats/chatsStore'
import { useIsActiveChat } from '@/chats/useIsActiveChat'

type ChatListItemProps = {
  chat: Chat
}

function ChatListItem({ chat }: ChatListItemProps) {
  const isActive = useIsActiveChat(chat.chatId)

  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/${chat.chatId}`)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {chat.title.replace('@', '').slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate">{chat.title}</span>
      </button>
    </li>
  )
}

export default memo(ChatListItem)
