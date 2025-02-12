
import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, FolderTree, Network, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSyncEntries } from "@/hooks/use-sync-entries";

export const Navigation = () => {
  const location = useLocation();
  const { isSyncing, queueSize } = useSyncEntries();

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
                  "flex-1 max-w-[120px] gap-2 transition-colors",
                  isActive("/") &&
                    "bg-white text-black hover:bg-white/90 hover:text-black"
                )}
                asChild
              >
                <Link to="/">
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Vault</span>
                  {queueSize > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full text-xs flex items-center justify-center">
                      {queueSize}
                    </span>
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Vault {queueSize > 0 ? `(${queueSize} pending)` : ''}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[120px] gap-2 transition-colors",
                  isActive("/new") &&
                    "bg-white text-black hover:bg-white/90 hover:text-black"
                )}
                asChild
              >
                <Link to="/new">
                  <PlusCircle className="h-5 w-5" />
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
                  "flex-1 max-w-[120px] gap-2 transition-colors",
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
                  "flex-1 max-w-[120px] gap-2 transition-colors",
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

          {isSyncing && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-500/20 text-orange-200 px-3 py-1 rounded-full text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Syncing...
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};
