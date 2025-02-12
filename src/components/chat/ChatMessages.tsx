
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
}

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-zinc-500 text-center">
            Start a conversation...
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary/20 text-primary ml-4 rounded-br-sm'
                    : 'bg-white/10 text-white/90 mr-4 rounded-bl-sm'
                }`}
              >
                <div className="text-xs text-white/50 mb-1">
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
