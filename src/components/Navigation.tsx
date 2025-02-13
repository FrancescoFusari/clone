
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, PlusCircle, FileText, MessageCircle, Book, BookOpen, Robot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      title: "AI Entry",
      description: "Create an AI-processed entry",
      icon: Robot,
      action: () => navigate("/new")
    },
    {
      title: "Simple Entry",
      description: "Create an unprocessed note",
      icon: BookOpen,
      action: () => navigate("/new?type=simple")
    },
    {
      title: "Chat",
      description: "Start a conversation with AI",
      icon: MessageCircle,
      action: () => navigate("/chat")
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-40">
      <nav className="max-w-[400px] mx-auto rounded-full p-2 bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex justify-between items-center gap-2 px-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-12 h-12 rounded-full transition-all duration-300",
                  isActive("/") && "bg-white/10"
                )}
                asChild
              >
                <Link to="/">
                  <Book className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vault</TooltipContent>
          </Tooltip>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="w-14 h-14 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/25 transition-all duration-300 hover:scale-105"
              >
                <PlusCircle className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-[320px] rounded-2xl p-0 border-white/10 bg-zinc-900/90 backdrop-blur-xl">
              <div className="p-2">
                {menuItems.map((item) => (
                  <Button
                    key={item.title}
                    variant="ghost"
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors text-left"
                    onClick={() => {
                      item.action();
                    }}
                  >
                    <div className="p-2 rounded-xl bg-white/5">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-zinc-400">{item.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-12 h-12 rounded-full transition-all duration-300",
                  isActive("/chat") && "bg-white/10"
                )}
                asChild
              >
                <Link to="/chat">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </div>
  );
};
