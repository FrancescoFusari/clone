import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { PrivacyNotice } from "./PrivacyNotice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const NewEntry = () => {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"personal" | "work" | "social" | "interests_and_hobbies" | "school">("personal");
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session?.user.id) return;

    setLoading(true);
    const { error } = await supabase.from("entries").insert({
      content,
      category,
      user_id: session.user.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Entry saved successfully!",
      });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="container max-w-2xl py-8">
      <PrivacyNotice />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          value={category}
          onValueChange={(value: typeof category) => setCategory(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="interests_and_hobbies">Interests & Hobbies</SelectItem>
            <SelectItem value="school">School</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your entry here..."
          className="min-h-[200px]"
        />
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? "Saving..." : "Save Entry"}
        </Button>
      </form>
    </div>
  );
};