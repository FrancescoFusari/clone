import { List, LogOut, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useAuth } from "./AuthProvider";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (!session) return null;

  return (
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 glass-morphism rounded-full px-6 py-3 shadow-lg z-50">
      <ul className="flex items-center space-x-8">
        <li>
          <Link
            to="/"
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              isActive("/")
                ? "bg-white/20 text-white shadow-lg"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <List className="w-6 h-6" />
          </Link>
        </li>
        <li>
          <Link
            to="/new"
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              isActive("/new")
                ? "bg-white/20 text-white shadow-lg"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Plus className="w-6 h-6" />
          </Link>
        </li>
        <li>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-12 h-12 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-all duration-300"
          >
            <LogOut className="w-6 h-6" />
          </Button>
        </li>
      </ul>
    </nav>
  );
};