
import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, FolderTree, Network, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-40">
      <nav className="max-w-screen-sm mx-auto rounded-full p-2 bg-zinc-900/40 backdrop-blur-md border border-white/5">
        <div className="flex justify-center items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[100px] gap-2 transition-all duration-300",
                  isActive("/") && "text-white hover:text-white"
                )}
                asChild
              >
                <Link to="/">
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Vault</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vault</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[140px] gap-2 transition-all duration-300 scale-105",
                  isActive("/new")
                    ? "bg-white text-black hover:bg-white/90 hover:text-black scale-110"
                    : "hover:scale-110"
                )}
                asChild
              >
                <Link to="/new">
                  <PlusCircle className="h-6 w-6" />
                  <span className="sr-only">New Entry</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Entry</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[140px] gap-2 transition-all duration-300 scale-105",
                  isActive("/chat")
                    ? "bg-white text-black hover:bg-white/90 hover:text-black scale-110"
                    : "hover:scale-110"
                )}
                asChild
              >
                <Link to="/chat">
                  <MessageCircle className="h-6 w-6" />
                  <span className="sr-only">Chat</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[100px] gap-2 transition-all duration-300",
                  isActive("/categories") &&
                    "bg-white text-black hover:bg-white/90 hover:text-black"
                )}
                asChild
              >
                <Link to="/categories">
                  <FolderTree className="h-5 w-5" />
                  <span className="sr-only">Categories</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Categories</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[100px] gap-2 transition-all duration-300",
                  isActive("/mind-map") &&
                    "bg-white text-black hover:bg-white/90 hover:text-black"
                )}
                asChild
              >
                <Link to="/mind-map">
                  <Network className="h-5 w-5" />
                  <span className="sr-only">Mind Map</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mind Map</TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </div>
  );
};
