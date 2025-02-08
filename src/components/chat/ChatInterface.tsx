
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onClose: () => void;
  onSaveEntry?: (content: string) => Promise<void>;
}

export const ChatInterface = ({ onClose, onSaveEntry }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [model, setModel] = useState<'gpt-4o-mini' | 'gpt-4o'>('gpt-4o-mini');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewConversation = async (firstMessage: string) => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert([
        {
          user_id: session?.user.id,
          title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
          model
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    return data.id;
  };

  const saveMessage = async (content: string, role: 'user' | 'assistant', conversationId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .insert([
        {
          conversation_id: conversationId,
          content,
          role
        }
      ]);

    if (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !session?.user) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // Create new conversation if none exists
      const currentConversationId = conversationId || await createNewConversation(userMessage);
      setConversationId(currentConversationId);

      // Add and save user message
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      await saveMessage(userMessage, 'user', currentConversationId);

      // Get AI response
      const { data, error } = await supabase.functions.invoke('process-chat', {
        body: { message: userMessage, model }
      });

      if (error) throw error;

      const aiMessage = data.message;
      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
      await saveMessage(aiMessage, 'assistant', currentConversationId);

    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsEntry = async () => {
    if (!messages.length || !onSaveEntry) return;

    setIsSaving(true);
    try {
      // Format the chat into a coherent text entry
      const formattedContent = messages
        .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
        .join('\n\n');

      await onSaveEntry(formattedContent);
      toast({
        title: "Success",
        description: "Chat saved as an entry successfully",
      });
      onClose();
    } catch (error) {
      console.error('Error saving chat as entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save chat as entry. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-black/20 rounded-lg border border-white/10 relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <Select value={model} onValueChange={(value: 'gpt-4o-mini' | 'gpt-4o') => setModel(value)}>
            <SelectTrigger className="w-[180px] bg-black/20 border-white/10">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4 Mini (Fast)</SelectItem>
              <SelectItem value="gpt-4o">GPT-4 (Powerful)</SelectItem>
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAsEntry}
            disabled={isSaving || !messages.length}
            className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save as Entry
              </>
            )}
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClose}
          className="hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg transition-colors ${
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
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
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
    </div>
  );
};

