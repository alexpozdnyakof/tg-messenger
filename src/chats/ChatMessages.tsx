import { cn } from "cn";
import type { RefObject } from "react";

export type ChatMessage = {
  id: string;
  author: "me" | "them";
  text: string;
};

type ChatMessagesProps = {
  messages: ChatMessage[];
  isLoading?: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
};

function ChatMessages({
  messages,
  isLoading = false,
  scrollContainerRef,
}: ChatMessagesProps) {
  const isEmpty = messages.length === 0;

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "min-h-0 flex-1 overflow-y-auto p-4",
        isEmpty
          ? "flex items-center justify-center"
          : "flex flex-col-reverse gap-2",
      )}
    >
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Загрузка истории…" : "Нет сообщений"}
        </p>
      ) : (
        [...messages].reverse().map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[70%] rounded-2xl px-3 py-2 text-sm break-words",
              message.author === "me"
                ? "self-end rounded-br-sm bg-primary text-primary-foreground"
                : "self-start rounded-bl-sm bg-muted text-foreground",
            )}
          >
            {message.text}
          </div>
        ))
      )}
    </div>
  );
}

export default ChatMessages;
