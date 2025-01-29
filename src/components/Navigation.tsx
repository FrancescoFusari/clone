import { Home, LogOut, PieChart, Plus } from "lucide-react";
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
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card backdrop-blur-lg rounded-full px-6 py-3 shadow-lg border border-gray-200/20 z-50">
      <ul className="flex items-center space-x-8">
        <li>
          <Link
            to="/"
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive("/")
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-secondary"
            }`}
          >
            <Home className="w-6 h-6" />
          </Link>
        </li>
        <li>
          <Link
            to="/new"
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive("/new")
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-secondary"
            }`}
          >
            <Plus className="w-6 h-6" />
          </Link>
        </li>
        <li>
          <Link
            to="/insights"
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive("/insights")
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-secondary"
            }`}
          >
            <PieChart className="w-6 h-6" />
          </Link>
        </li>
        <li>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-12 h-12 rounded-full text-gray-600 hover:bg-secondary"
          >
            <LogOut className="w-6 h-6" />
          </Button>
        </li>
      </ul>
    </nav>
  );
};