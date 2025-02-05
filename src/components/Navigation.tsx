import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PenSquare, Home, ChartBar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";

export const Navigation = () => {
  const location = useLocation();
  const { session } = useAuth();

  if (!session) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 backdrop-blur-lg bg-background/80 border-t border-white/10">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className={cn(
            "text-white/60 hover:text-white/90",
            isActive("/") && "text-white/90 bg-white/10"
          )}
        >
          <Link to="/">
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          asChild
          className={cn(
            "text-white/60 hover:text-white/90",
            isActive("/dashboard") && "text-white/90 bg-white/10"
          )}
        >
          <Link to="/dashboard">
            <ChartBar className="h-5 w-5" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          asChild
          className={cn(
            "text-white/60 hover:text-white/90",
            isActive("/new") && "text-white/90 bg-white/10"
          )}
        >
          <Link to="/new">
            <PenSquare className="h-5 w-5" />
            <span className="sr-only">New Entry</span>
          </Link>
        </Button>
      </div>
    </nav>
  );
};