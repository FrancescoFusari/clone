
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPageProps {
  onSaveEntry?: (content: string) => Promise<void>;
}

const Chat = ({ onSaveEntry }: ChatPageProps) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState<'gpt-4o-mini' | 'gpt-4o'>('gpt-4o-mini');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClose = () => {
    navigate('/new');
  };

  const handleSaveEntry = async () => {
    if (!messages.length) return;
    setLoading(true);
    try {
      // Format the chat into a coherent text entry
      const chatContent = messages
        .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
        .join('\n\n');

      // Process the chat content as an entry
      const { data, error } = await supabase.functions.invoke('process-entry', {
        body: { 
          content: chatContent,
          type: "text",
          folder: "default"
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chat saved as an entry",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error saving chat as entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save chat as entry",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-7rem)] bg-black/20 rounded-xl border border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <ModelSelector model={model} onModelChange={setModel} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveEntry}
              disabled={loading || !messages.length}
              className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save as Entry'
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
              className="hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ChatMessages messages={messages} />
        <ChatInput model={model} onMessageSent={handleNewMessage} />
      </div>
    </div>
  );
};

export default Chat;
