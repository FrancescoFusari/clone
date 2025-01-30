import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

export const PrivacyNotice = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkConsent = async () => {
      if (!session?.user.id) return;
      
      const { data, error } = await supabase
        .from('user_consent')
        .select('ai_processing_consent')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking consent:', error);
        setOpen(true);
      } else if (!data || !data.ai_processing_consent) {
        setOpen(true);
      }
      setLoading(false);
    };

    checkConsent();
  }, [session]);

  const handleConsent = async (consent: boolean) => {
    if (!session?.user.id) return;

    const { error } = await supabase
      .from('user_consent')
      .upsert({
        user_id: session.user.id,
        ai_processing_consent: consent,
        consent_date: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving consent:', error);
      toast({
        title: "Error",
        description: "Could not save your privacy preferences. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setOpen(false);
    
    if (!consent) {
      toast({
        title: "Privacy Settings Updated",
        description: "You've opted out of AI processing. Some features will be limited.",
      });
      navigate("/");
    } else {
      toast({
        title: "Privacy Settings Updated",
        description: "Thank you for your consent. You can continue using all features.",
      });
    }
  };

  if (loading) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh]">
        <SheetHeader className="space-y-4">
          <SheetTitle>Privacy Notice & Data Processing</SheetTitle>
          <SheetDescription className="text-left space-y-4">
            <p>
              We value your privacy and want to be transparent about how we handle your data:
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold">Data Collection & Processing:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your entries are securely stored and only accessible by you</li>
                <li>We use OpenAI's API to process your entries for analysis and insights</li>
                <li>Data sent to OpenAI is subject to their privacy policy and data handling practices</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Your Rights:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>You can request deletion of your data at any time</li>
                <li>You can opt-out of AI processing, but this will limit app functionality</li>
                <li>You can export your data through your account settings</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Important Note:</h3>
              <p>
                This application requires AI processing to function properly. Opting out will significantly limit its functionality.
              </p>
            </div>
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 mt-8">
          <Button 
            onClick={() => handleConsent(true)}
            className="w-full"
          >
            I Consent to Data Processing
          </Button>
          <Button 
            onClick={() => handleConsent(false)}
            variant="outline"
            className="w-full"
          >
            I Do Not Consent (Limited Functionality)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};