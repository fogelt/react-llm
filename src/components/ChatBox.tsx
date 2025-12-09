import { useState, ChangeEvent } from "react";
import { Message } from "../types";
import { streamChatMessage } from "../services/chatService";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

//Imported in app.tsx
export function ChatBox() {
  // messages → array of chat messages
  // setMessages → function to update messages
  const [messages, setMessages] = useState<Message[]>([]);

  // input box state
  const [input, setInput] = useState<string>("");

  // loading state for the assistant (e.g., typing indicator)
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Called when user presses "Send"
  const handleSendMessage = async () => {

    // If the message is empty, ignore
    if (!input.trim()) return;

    // Save text locally, clear UI input field
    const userMessage = input;
    setInput("");

    setIsLoading(true);

    // Add the user's message to the UI
    const newUserMessage: Message = {
      role: "user",
      content: userMessage
    };

    // Create a placeholder message for the assistant (starts empty)
    const newAssistantMessage: Message = {
      role: "assistant",
      content: ""
    };

    // Add both messages at once (user + placeholder assistant)
    setMessages((prev) => [...prev, newUserMessage, newAssistantMessage]);

    // A local variable to store the assistant's streamed response
    let assistantMessage = "";

    // Start streaming
    await streamChatMessage(
      [...messages, newUserMessage, newAssistantMessage],
      (chunk) => {
        // Append chunk to full assistant message
        assistantMessage += chunk;

        // Update only the *last* message (the assistant placeholder)
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: assistantMessage
          };
          return updated;
        });
      }
    );

    setIsLoading(false);
  };


  const handleUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);

    try {
      setIsLoading(true);

      // Upload the file to upload-server
      const res = await fetch("http://localhost:8081/api/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) { //Error handling
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json(); // await database return then we 

      // Initialize local assistant message for streaming
      let assistantMessage = "";

      if (data.type === "pdf") {
        // PDF upload: combine name and text
        const docName = data.name || file.name;
        const docText = data.text || "";

        // Add user message describing the uploaded document
        const userMessage: Message = {
          role: "user",
          content: `Uploaded a PDF`,
          extraContext: `Uploaded ${docName}\n\nDocument content:\n${docText}`
        };

        // Placeholder assistant message (will be updated as streaming occurs)
        const assistantPlaceholder: Message = {
          role: "assistant",
          content: ""
        };

        // Add both messages to state at once
        setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

        // Use a local copy of messages to pass to streaming function
        const messagesForStream = [...messages, userMessage, assistantPlaceholder];

        // Stream the assistant's response
        await streamChatMessage(messagesForStream, (chunk) => {
          assistantMessage += chunk;

          // Update the last message (assistant) with the new chunk
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: assistantMessage,
            };
            return updated;
          });
        });
      } else if (data.type === "image") {
        // Image upload: get base64 string
        const imgBase64 = data.base64;

        const userMessage: Message = {
          role: "user",
          content: "Here's an uploaded image for you to check:",
          images: [imgBase64],
        };

        const assistantPlaceholder: Message = {
          role: "assistant",
          content: ""
        };

        setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

        const messagesForStream = [...messages, userMessage, assistantPlaceholder];

        // Stream assistant response
        await streamChatMessage(messagesForStream, (chunk) => {
          assistantMessage += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: assistantMessage,
            };
            return updated;
          });
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(
        "File upload failed. Make sure the upload server is running at http://localhost:8081"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='chat-box'>
      <MessageList messages={messages} />
      <ChatInput
        value={input}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSendMessage}
        isLoading={isLoading}
        onUpload={handleUpload}
      />
    </div>
  );
}
