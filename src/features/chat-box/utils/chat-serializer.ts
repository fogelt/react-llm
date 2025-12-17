import { Message } from "@/types";


let currentChatId: string | undefined = undefined;

export function saveChat(messages: Message[], chatId?: string) {
  const idToSave = chatId || currentChatId;
  if (idToSave) {
    if (chatId) {
      currentChatId = chatId.startsWith('chat-') ? chatId.replace('chat-', '') : chatId;
    }
    const finalKey = `chat-${currentChatId}`;
    localStorage.setItem(finalKey, JSON.stringify(messages));

    return currentChatId;
  }
}

export function loadChat(chatIdWithPrefix: string): Message[] | null {
  const data = localStorage.getItem(chatIdWithPrefix);
  if (!data) return null;
  try {
    currentChatId = chatIdWithPrefix.replace('chat-', '')
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function getChatId() {
  return currentChatId;
}