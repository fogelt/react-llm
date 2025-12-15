import { Message } from "@/types";


let currentChatId: string | null = null;

export function saveChat(messages: Message[], chatId?: string) {
  if (chatId) {
    currentChatId = chatId;

    localStorage.setItem(`chat-${currentChatId}`, JSON.stringify(messages));
    return currentChatId;
  }
}

export function loadChat(chatId: string): Message[] | null {
  const data = localStorage.getItem(chatId);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
