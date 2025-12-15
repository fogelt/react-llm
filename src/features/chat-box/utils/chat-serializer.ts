import { Message } from "@/types";

let currentChatId: string | null = null;

export function saveChat(messages: Message[], chatId?: string) {
  if (!chatId && !currentChatId) {
    currentChatId = generateUID(); // first time we save
  } else if (chatId) {
    currentChatId = chatId;
  }

  localStorage.setItem(`chat-${currentChatId}`, JSON.stringify(messages));
  return currentChatId;
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

function generateUID() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
