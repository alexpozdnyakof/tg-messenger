import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { getChatHistory, sendMessage } from "@/api/greenApiClient";
import { useAuthStore } from "@/auth/authStore";
import { handleGreenApiAuthError } from "@/auth/handleGreenApiAuthError";
import ChatMessages, { type ChatMessage } from "@/chats/ChatMessages";
import MessageForm from "@/chats/MessageForm";
import { useMessagesStore } from "@/chats/messagesStore";

type ChatProps = {
  chatId: string;
};

const EMPTY_MESSAGES: ChatMessage[] = [];

function Chat({ chatId }: ChatProps) {
  const credentials = useAuthStore((state) => state.credentials);
  const messages = useMessagesStore(
    (state) => state.messagesByChatId[chatId] ?? EMPTY_MESSAGES,
  );
  const hasHistory = useMessagesStore(
    (state) => chatId in state.messagesByChatId,
  );
  const setMessages = useMessagesStore((state) => state.setMessages);
  const addMessage = useMessagesStore((state) => state.addMessage);
  const [historyError, setHistoryError] = useState<{
    chatId: string;
    message: string;
  }>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasHistory || !credentials) return;

    getChatHistory(credentials, chatId).then((result) => {
      if (result.ok) {
        setMessages(chatId, result.messages);
        setHistoryError(undefined);
      } else {
        setHistoryError({
          chatId,
          message: handleGreenApiAuthError(result.error),
        });
      }
    });
  }, [chatId, hasHistory, credentials, setMessages]);

  const currentHistoryError =
    historyError?.chatId === chatId ? historyError.message : undefined;

  async function handleSend(text: string) {
    if (!credentials) {
      throw new Error("Нет активной сессии");
    }

    const result = await sendMessage(credentials, { chatId, message: text });
    if (!result.ok) {
      throw new Error(handleGreenApiAuthError(result.error));
    }
    // синхронное обновление для скроллинга к новому сообщению
    flushSync(() => {
      addMessage(chatId, { id: result.idMessage, author: "me", text });
    });

    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatMessages
        messages={messages}
        isLoading={!hasHistory && !currentHistoryError}
        scrollContainerRef={scrollContainerRef}
      />
      {currentHistoryError && (
        <p className="px-4 pb-2 text-sm text-destructive">
          {currentHistoryError}
        </p>
      )}
      <MessageForm key={chatId} onSend={handleSend} />
    </div>
  );
}

export default Chat;
