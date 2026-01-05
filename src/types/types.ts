export type Source = {
  title: string;
  url: string;
  snippet?: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  extraContext?: string;
  images?: string[];
  usedTool?: boolean;
  toolName?: string;
  isError?: boolean;
  toolStatus?: string;
  sources?: Source[];
};