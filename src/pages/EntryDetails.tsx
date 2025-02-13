import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { type Entry } from "@/integrations/supabase/types";

const EntryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!id) {
          setError("Invalid entry ID");
          return;
        }

        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching entry:", error);
          setError(error.message);
        } else if (data) {
          setEntry(data);
        } else {
          setError("Entry not found");
        }
      } catch (err: any) {
        console.error("Unexpected error:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {entry ? (
          <>
            {entry.was_content_truncated && (
              <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-600/50 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  Note: This entry was truncated due to length limitations. The content shown below represents the analyzed portion of your entry.
                </p>
              </div>
            )}
            <h1 className="text-3xl font-bold mb-4">{entry.title}</h1>
            <div className="text-zinc-400 mb-2">
              Category: {entry.category}, Subcategory: {entry.subcategory}
            </div>
            <div className="mb-6">{entry.formatted_content}</div>

            {entry.entry_comments && entry.entry_comments.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Comments</h2>
                <ul>
                  {entry.entry_comments.map((comment, index) => (
                    <li key={index} className="mb-2">
                      <span className="font-semibold">{comment.type}:</span> {comment.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {entry.has_attachments && entry.attachments && entry.attachments.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Attachments</h2>
                {entry.attachments.map((attachment, index) => (
                  <div key={index}>
                    {attachment.type === "image" && (
                      <img src={attachment.url} alt={attachment.caption} className="max-w-full h-auto rounded-lg" />
                    )}
                    <p className="text-sm text-zinc-400">{attachment.caption}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="text-center">Loading entry details...</div>
        ) : (
          <div className="text-red-500 text-center">Error: {error || "Failed to load entry"}</div>
        )}
      </div>
    </div>
  );
};

export default EntryDetails;
