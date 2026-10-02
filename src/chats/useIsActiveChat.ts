import { useLocationProperty } from "wouter/use-browser-location";

export function useIsActiveChat(chatId: string): boolean {
  return useLocationProperty(() => window.location.pathname === `/${chatId}`);
}
