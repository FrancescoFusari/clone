
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  model: 'o3-mini' | 'gpt-4o-mini' | 'gpt-4o';
  onMessageSent?: (message: { role: 'user' | 'assistant', content: string }) => void;
}

export const ChatInput = ({ model, onMessageSent }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Send user message to UI
      onMessageSent?.({ role: 'user', content: inputValue.trim() });

      // Send to backend
      const { data, error } = await supabase.functions.invoke('process-chat', {
        body: { message: inputValue.trim(), model }
      });

      if (error) throw error;

      // Send AI response to UI
      onMessageSent?.({ role: 'assistant', content: data.message });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
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
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
};
