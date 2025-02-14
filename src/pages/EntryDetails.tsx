import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Entry } from "@/integrations/supabase/types";

export const EntryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"personal" | "work" | "social" | "interests" | "school">("personal");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          setEntry(data);
          setContent(data.content);
          setSelectedCategory(data.category);
        }
      } catch (error) {
        console.error("Error fetching entry:", error);
        toast({
          title: "Error",
          description: "Failed to fetch entry",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  const setCategory = (value: "personal" | "work" | "social" | "interests" | "school") => {
    if (value) {
      setSelectedCategory(value);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("entries")
        .update({
          content,
          category: selectedCategory,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry saved successfully",
      });
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: "Failed to save entry",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <RadioGroup
            value={selectedCategory}
            onValueChange={(value: "personal" | "work" | "social" | "interests" | "school") =>
              setCategory(value)
            }
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal">Personal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="work" id="work" />
              <Label htmlFor="work">Work</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="social" id="social" />
              <Label htmlFor="social">Social</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="interests" id="interests" />
              <Label htmlFor="interests">Interests</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="school" id="school" />
              <Label htmlFor="school">School</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px]"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash className="h-4 w-4" />
          )}
          <span className="ml-2">Delete</span>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-2">Save</span>
        </Button>
      </div>
    </div>
  );
};
