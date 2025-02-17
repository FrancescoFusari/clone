import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Copy, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database["public"]["Tables"]["entries"]["Row"];
type EntryCategory = Database["public"]["Tables"]["categories"]["Row"]["name"];

export default function EntryDetails() {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: entry, isLoading, isError } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => {
      if (!id) throw new Error("Entry ID is required");
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      return data as Entry;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setDate(entry.date ? new Date(entry.date) : undefined);
      setSelectedCategory(entry.category as EntryCategory);
    }
  }, [entry]);

  const { mutate: updateEntry, isLoading: isUpdating } = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Entry ID is required");
      if (!session?.user?.id) throw new Error("User ID is required");

      const { error } = await supabase
        .from("entries")
        .update({
          title,
          content,
          date: date?.toISOString(),
          category: selectedCategory,
        })
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry", id] });
      toast.success("Entry updated successfully!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Failed to update entry: ${error.message}`);
    },
  });

  const { mutate: deleteEntry, isLoading: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Entry ID is required");
      if (!session?.user?.id) throw new Error("User ID is required");

      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Entry deleted successfully!");
      navigate("/");
    },
    onError: (error) => {
      toast.error(`Failed to delete entry: ${error.message}`);
    },
  });
  
  const handleCategoryChange = (category: EntryCategory | "") => {
    if (category === "") return; // Skip empty category
    setSelectedCategory(category as EntryCategory);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-3/4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !entry) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardContent>
          <p className="text-center">Error loading entry.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader>
        <CardTitle>
          {isEditing ? (
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          ) : (
            title
          )}
        </CardTitle>
        <div className="ml-auto space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setTitle(entry.title);
                  setContent(entry.content);
                  setDate(entry.date ? new Date(entry.date) : undefined);
                  setSelectedCategory(entry.category as EntryCategory);
                  setIsEditing(false);
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={() => updateEntry()} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/entries/${entry.id}`
                  );
                  toast.success("Link copied to clipboard!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteEntry()}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Category</Label>
            {isEditing ? (
              <Select onValueChange={(value) => handleCategoryChange(value as EntryCategory)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a category" defaultValue={selectedCategory || ""}/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Hobbies">Hobbies</SelectItem>
                  <SelectItem value="Relationships">Relationships</SelectItem>
                  <SelectItem value="Goals">Goals</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge>{entry.category}</Badge>
            )}
          </div>

          <div>
            <Label>Date</Label>
            {isEditing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : date ? (
              <div>{format(date, "PPP")}</div>
            ) : (
              <div>No date set</div>
            )}
          </div>
        </div>

        <Separator />
        <div>
          <Label>Content</Label>
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          ) : (
            <div className="prose prose-sm prose-stone dark:prose-invert max-w-none">
              {content}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
