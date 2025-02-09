import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Tag, FileText, Sparkles, Search, Lightbulb, BookOpen, HelpCircle, MessageCircle, Trash, Edit2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ResearchData = {
  insights: string;
  questions: string[];
  key_concepts: string[];
  related_topics: string[];
};

type EntryComment = {
  id: string;
  text: string;
  type: "observation" | "question" | "suggestion";
};

const CATEGORIES = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'social', label: 'Social' },
  { value: 'interests_and_hobbies', label: 'Interests & Hobbies' },
  { value: 'school', label: 'School' }
];

const SUBCATEGORIES = {
  personal: [
    { value: 'health_and_wellness', label: 'Health and Wellness' },
    { value: 'mental_health', label: 'Mental Health' },
    { value: 'personal_growth', label: 'Personal Growth' },
    { value: 'relationships', label: 'Relationships' },
    { value: 'spirituality', label: 'Spirituality' },
    { value: 'daily_life', label: 'Daily Life' }
  ],
  work: [
    { value: 'projects', label: 'Projects' },
    { value: 'career_development', label: 'Career Development' },
    { value: 'workplace_dynamics', label: 'Workplace Dynamics' },
    { value: 'job_search', label: 'Job Search' },
    { value: 'business_ideas', label: 'Business Ideas' },
    { value: 'work_life_balance', label: 'Work-Life Balance' }
  ],
  social: [
    { value: 'friendships', label: 'Friendships' },
    { value: 'family', label: 'Family' },
    { value: 'networking', label: 'Networking' },
    { value: 'social_events', label: 'Social Events' },
    { value: 'community', label: 'Community' }
  ],
  interests_and_hobbies: [
    { value: 'arts_and_creativity', label: 'Arts and Creativity' },
    { value: 'sports_and_fitness', label: 'Sports and Fitness' },
    { value: 'reading_and_literature', label: 'Reading and Literature' },
    { value: 'music', label: 'Music' },
    { value: 'travel', label: 'Travel' },
    { value: 'technology', label: 'Technology' }
  ],
  school: [
    { value: 'academics', label: 'Academics' },
    { value: 'study_habits', label: 'Study Habits' },
    { value: 'extracurricular', label: 'Extracurricular' },
    { value: 'career_planning', label: 'Career Planning' },
    { value: 'student_life', label: 'Student Life' }
  ]
};

const formatContent = (text: string) => {
  const paragraphs = text.split(/\n\s*\n/);
  
  return paragraphs.map((paragraph, index) => {
    const formattedParagraph = paragraph
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ');
    
    return formattedParagraph.length > 0 ? (
      <p key={index} className="mb-4">
        {formattedParagraph}
      </p>
    ) : null;
  });
};

const EntryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedTags, setEditedTags] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedSubcategory, setEditedSubcategory] = useState("");

  if (!id) {
    console.log("No entry ID provided, redirecting to entries list");
    navigate("/");
    return null;
  }

  const { data: entry, isLoading, isError } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => {
      console.log("Fetching entry details for:", id);
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching entry:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load entry details",
        });
        throw error;
      }

      if (!data) {
        console.log("No entry found with id:", id);
        toast({
          variant: "destructive",
          title: "Entry not found",
          description: "The requested entry could not be found.",
        });
        navigate("/");
        return null;
      }

      console.log("Fetched entry details:", data);
      return data;
    },
    enabled: !!id,
    retry: false,
  });

  React.useEffect(() => {
    if (entry) {
      setEditedTitle(entry.title || "");
      setEditedContent(entry.formatted_content || entry.content || "");
      setEditedTags((entry.tags || []).join(", "));
      setEditedCategory(entry.category || "");
      setEditedSubcategory(entry.subcategory || "");
    }
  }, [entry]);

  const researchMutation = useMutation({
    mutationFn: async () => {
      if (!entry) return null;
      
      console.log("Generating research for entry:", id);
      const response = await supabase.functions.invoke('research-content', {
        body: { content: entry.content, title: entry.title },
      });

      if (response.error) {
        console.error("Error generating research:", response.error);
        throw response.error;
      }

      const researchData = response.data as ResearchData;

      const { error: updateError } = await supabase
        .from('entries')
        .update({ research_data: researchData })
        .eq('id', id);

      if (updateError) {
        console.error("Error saving research data:", updateError);
        throw updateError;
      }

      console.log("Research results saved:", researchData);
      return researchData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry", id] });
      toast({
        title: "Success",
        description: "Research insights generated and saved",
      });
    },
    onError: (error) => {
      console.error("Error in research mutation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate research insights",
      });
    },
  });

  const research = entry?.research_data as ResearchData | null;
  const isResearchLoading = researchMutation.isPending;

  const handleGenerateResearch = () => {
    if (!research) {
      researchMutation.mutate();
    }
  };

  const updateMutation = useMutation({
    mutationFn: async ({ title, content, tags, category, subcategory }: { 
      title: string; 
      content: string; 
      tags: string[]; 
      category: string;
      subcategory: string;
    }) => {
      const { data, error } = await supabase
        .from('entries')
        .update({
          title,
          content,
          formatted_content: content,
          tags,
          category,
          subcategory
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry", id] });
      toast({
        title: "Success",
        description: "Entry updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Error updating entry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update entry",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
      navigate("/");
    },
    onError: (error) => {
      console.error("Error deleting entry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete entry",
      });
    },
  });

  const handleSave = () => {
    const trimmedTags = editedTags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    updateMutation.mutate({
      title: editedTitle,
      content: editedContent,
      tags: trimmedTags,
      category: editedCategory,
      subcategory: editedSubcategory,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !entry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate(-1)}
          variant="outline"
          className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load entry details. The entry might have been deleted or you may not have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-24">
      <Card className="glass-morphism overflow-hidden mb-8">
        <CardHeader className="space-y-2">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gradient">Entry Details</h1>
            <p className="text-lg text-white/80 leading-relaxed">
              View the complete details of your entry, including AI-generated insights, key concepts, and related topics. Use these insights to explore your thoughts more deeply.
            </p>
          </div>
        </CardHeader>
      </Card>

      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Entries
        </Button>
        
        {!isEditing && (
          <>
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
            >
              <Edit2 className="mr-2 h-4 w-4" /> Edit Entry
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-500/10 hover:bg-red-500/20"
                >
                  <Trash className="mr-2 h-4 w-4" /> Delete Entry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your entry.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        
        {isEditing && (
          <>
            <Button
              variant="default"
              onClick={handleSave}
              className="bg-green-500/10 hover:bg-green-500/20"
              disabled={updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </>
        )}
      </div>

      <Card className="mb-6 backdrop-blur-lg bg-white/5 border-white/10">
        <CardHeader>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-white/90"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={editedCategory} 
                  onValueChange={(value) => {
                    setEditedCategory(value);
                    setEditedSubcategory(''); // Reset subcategory when category changes
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white/90">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem 
                        key={category.value} 
                        value={category.value}
                        className="cursor-pointer"
                      >
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select 
                  value={editedSubcategory} 
                  onValueChange={setEditedSubcategory}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white/90">
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {editedCategory && SUBCATEGORIES[editedCategory]?.map(sub => (
                      <SelectItem 
                        key={sub.value} 
                        value={sub.value}
                        className="cursor-pointer"
                      >
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <CardTitle className="flex items-center gap-2 text-white/90">
                <FileText className="h-5 w-5" />
                {entry.title || "Untitled Entry"}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-white/60">
                <Calendar className="h-4 w-4" />
                {format(new Date(entry.created_at), "PPp")}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[200px] bg-white/5 border-white/10 text-white/90"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="bg-white/5 border-white/10 text-white/90"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="prose max-w-none mb-6 dark:prose-invert text-white/80">
                {formatContent(entry.formatted_content || entry.content)}
              </div>

              {Array.isArray(entry.entry_comments) && entry.entry_comments.length > 0 && (
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-white/60" />
                    <h3 className="text-lg font-semibold text-white/90">AI Comments & Observations</h3>
                  </div>
                  <div className="grid gap-4">
                    {(entry.entry_comments as EntryComment[]).map((comment) => (
                      <Alert key={comment.id} className="bg-white/5 border-white/10">
                        <div className="flex items-center gap-2">
                          {comment.type === "observation" && <Sparkles className="h-4 w-4" />}
                          {comment.type === "question" && <HelpCircle className="h-4 w-4" />}
                          {comment.type === "suggestion" && <Lightbulb className="h-4 w-4" />}
                          <span className="capitalize text-sm font-medium">{comment.type}</span>
                        </div>
                        <AlertDescription className="mt-2 text-white/80">
                          {comment.text}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {(entry.summary || entry.title) && (
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-white/60" />
                    <h3 className="text-lg font-semibold text-white/90">AI Generated Content</h3>
                  </div>
                  <div className="grid gap-4 p-4 rounded-lg bg-white/5">
                    {entry.title && (
                      <div>
                        <span className="text-sm font-medium text-white/60">Title:</span>
                        <p className="text-white/80">{entry.title}</p>
                      </div>
                    )}
                    {entry.summary && (
                      <div>
                        <span className="text-sm font-medium text-white/60">Summary:</span>
                        <p className="text-white/80">{entry.summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-6">
                  <Tag className="h-4 w-4 text-white/60" />
                  {entry.tags.map((tag: string) => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className="bg-white/10 text-white/80 hover:bg-white/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-white/60" />
                    <h3 className="text-lg font-semibold text-white/90">AI Research Insights</h3>
                  </div>
                  {!research && !isResearchLoading && (
                    <Button
                      onClick={handleGenerateResearch}
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
                    >
                      Generate Insights
                    </Button>
                  )}
                </div>

                {isResearchLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4 bg-white/5" />
                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                    <Skeleton className="h-4 w-2/3 bg-white/5" />
                  </div>
                ) : research ? (
                  <div className="grid gap-6">
                    <Alert className="bg-white/5 border-white/10">
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>Key Concepts</AlertTitle>
                      <AlertDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {research.key_concepts.map((concept: string) => (
                            <Badge 
                              key={concept}
                              variant="secondary" 
                              className="bg-white/10 text-white/80 hover:bg-white/20"
                            >
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>

                    <Alert className="bg-white/5 border-white/10">
                      <BookOpen className="h-4 w-4" />
                      <AlertTitle>Related Topics</AlertTitle>
                      <AlertDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {research.related_topics.map((topic: string) => (
                            <Badge 
                              key={topic}
                              variant="secondary"
                              className="bg-white/10 text-white/80 hover:bg-white/20"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>

                    <Alert className="bg-white/5 border-white/10">
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>AI Insights</AlertTitle>
                      <AlertDescription className="mt-2 text-white/80">
                        {research.insights}
                      </AlertDescription>
                    </Alert>

                    <Alert className="bg-white/5 border-white/10">
                      <HelpCircle className="h-4 w-4" />
                      <AlertTitle>Questions to Consider</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-4 mt-2 space-y-2 text-white/80">
                          {research.questions.map((question: string) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Alert className="bg-white/5 border-white/10">
                    <AlertTitle>No research insights available</AlertTitle>
                    <AlertDescription>
                      Click the "Generate Insights" button to analyze this entry and generate research insights.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EntryDetails;
