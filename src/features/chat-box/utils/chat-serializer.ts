import { Message } from "@/types";


export interface ChatData {
  messages: Message[];
  contextUsage: number;
}

let currentChatId: string | undefined = undefined;

export function saveChat(messages: Message[], contextUsage: number, chatId?: string) {
  const idToSave = chatId || currentChatId;
  if (idToSave) {
    if (chatId) {
      currentChatId = chatId.startsWith('chat-') ? chatId.replace('chat-', '') : chatId;
    }
    const finalKey = `chat-${currentChatId}`;

    const dataToSave: ChatData = {
      messages,
      contextUsage
    };

    localStorage.setItem(finalKey, JSON.stringify(dataToSave));
    return currentChatId;
  }
}

export function loadChat(chatIdWithPrefix: string): ChatData | null {
  const data = localStorage.getItem(chatIdWithPrefix);
  if (!data) return null;
  try {
    currentChatId = chatIdWithPrefix.replace('chat-', '');
    const parsed = JSON.parse(data);

    if (Array.isArray(parsed)) {
      return { messages: parsed, contextUsage: 0 };
    }
    return parsed;
  } catch {
    return null;
  }
}