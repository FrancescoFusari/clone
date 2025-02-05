import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, Clock } from "lucide-react";
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
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
      <nav className="max-w-screen-sm mx-auto glass-morphism rounded-full p-2 pointer-events-auto">
        <div className="flex justify-center items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 max-w-[120px] gap-2",
                  isActive("/") &&
                    "bg-white/10 text-white hover:bg-white/20 hover:text-white"
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
                  "flex-1 max-w-[120px] gap-2",
                  isActive("/timeline") &&
                    "bg-white/10 text-white hover:bg-white/20 hover:text-white"
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
                  "flex-1 max-w-[120px] gap-2",
                  isActive("/new") &&
                    "bg-white/10 text-white hover:bg-white/20 hover:text-white"
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
        </div>
      </nav>
    </div>
  );
};