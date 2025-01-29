import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export const NewEntry = () => {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement actual submission logic
    toast({
      title: "Success",
      description: "Entry saved successfully",
    });
    setContent("");
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <Card className="max-w-2xl mx-auto mt-12 p-6 bg-card backdrop-blur-lg border-gray-200/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">New Entry</h1>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[200px] resize-none"
          />
          <Button type="submit" className="w-full">
            Save Entry
          </Button>
        </form>
      </Card>
    </div>
  );
};