
import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, Clock, FolderTree, Network, AlertOctagon } from "lucide-react";
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
      <nav className="max-w-screen-sm mx-auto rounded-full p-2 bg-zinc-900/80 backdrop-blur-sm border border-white/10">
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
                  <span className="sr-only">Home</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Home</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[120px] gap-2 transition-colors",
                  isActive("/timeline") &&
                    "bg-white text-black hover:bg-white/90 hover:text-black"
                )}
                asChild
              >
                <Link to="/timeline">
                  <Clock className="h-5 w-5" />
                  <span className="sr-only">Timeline</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Timeline</TooltipContent>
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[120px] gap-2 transition-colors",
                  isActive("/test") &&
                    "bg-white text-black hover:bg-white/90 hover:text-black"
                )}
                asChild
              >
                <Link to="/test">
                  <AlertOctagon className="h-5 w-5" />
                  <span className="sr-only">Test Page</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Test Page</TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </div>
  );
};
