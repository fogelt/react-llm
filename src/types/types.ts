export type Message = {
  role: "user" | "assistant";
  content: string;
  extraContext?: string;
  images?: string[];
};