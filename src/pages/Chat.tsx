
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";

interface ChatPageProps {
  onSaveEntry?: (content: string) => Promise<void>;
}

const Chat = ({ onSaveEntry }: ChatPageProps) => {
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'gpt-4o-mini' | 'gpt-4o'>('gpt-4o-mini');
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/new');
  };

  const handleSaveEntry = async (chatContent: string) => {
    if (!onSaveEntry) return;
    setLoading(true);
    try {
      await onSaveEntry(chatContent);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4 pb-24">
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-2rem)] bg-black/20 rounded-xl border border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <ModelSelector model={model} onModelChange={setModel} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveEntry("Test content")}
              disabled={loading}
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

        <ChatMessages />
        <ChatInput model={model} />
      </div>
    </div>
  );
};

export default Chat;
