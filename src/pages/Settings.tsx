
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            <Sun className="h-5 w-5" />
            <Label htmlFor="theme-toggle">Light Mode</Label>
          </div>
          <Switch
            id="theme-toggle"
            checked={theme === "light"}
            onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
          />
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
