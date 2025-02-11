
import { ScrollArea } from "@/components/ui/scroll-area";

export const ChatMessages = () => {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {/* Messages will be implemented here */}
        <div className="text-zinc-500 text-center">
          Start a conversation...
        </div>
      </div>
    </ScrollArea>
  );
};
