
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  model: string;
}

export const ChatInput = ({ model }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Chat functionality will be implemented here
      console.log("Sending message:", inputValue, "with model:", model);
    } finally {
      setInputValue("");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-white/5">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 bg-black/20 border-white/10 text-white/90 placeholder:text-white/40"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={isLoading || !inputValue.trim()}
          className="bg-primary/20 hover:bg-primary/30 text-primary"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
