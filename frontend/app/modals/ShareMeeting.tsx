"use client";
import { useState, Fragment } from "react";
import { Dialog, DialogTitle, DialogPanel, Transition, TransitionChild, Description } from "@headlessui/react";
import { X, Copy, UserPlus, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareMeetingProps {
  enable: boolean;
  setEnable: (enable: boolean) => void;
  meetingLink: string;
  meetingPin?: string;
  isPrivate?: boolean;
}

export default function ShareMeeting({ enable, setEnable, meetingLink, meetingPin, isPrivate = false }: ShareMeetingProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Meeting link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleCopyPin = async () => {
    if (!meetingPin) return;
    try {
      await navigator.clipboard.writeText(meetingPin);
      toast({
        title: "PIN Copied",
        description: "Meeting PIN copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy PIN:", error);
    }
  };

  return (
    <Transition appear show={enable} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setEnable(false)}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card border border-primary/20 p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle as="h3" className="text-xl font-bold text-foreground">
                    Votre réunion est prête
                  </DialogTitle>
                  <button
                    onClick={() => setEnable(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <Description className="text-sm text-muted-foreground mb-6">
                  Partagez ce lien avec les personnes que vous souhaitez inviter à la réunion
                </Description>

                {/* Add Participants Button */}
                <Button
                  className="w-full mb-6 bg-primary hover:bg-primary/90"
                  onClick={() => {
                    // Could add functionality to invite via email/contacts
                    toast({
                      title: "Coming Soon",
                      description: "Invite participants feature coming soon",
                    });
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter des participants
                </Button>

                {/* Meeting Link Section */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Ou partagez ce lien avec les personnes que vous souhaitez inviter à la réunion
                  </p>
                  <div className="flex items-center gap-2 bg-card/50 border border-primary/10 rounded-lg p-3">
                    <input
                      type="text"
                      readOnly
                      value={meetingLink}
                      className="flex-1 bg-transparent text-sm text-foreground outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="text-primary hover:text-primary/80 transition-colors p-1"
                      title="Copy link"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* PIN Section (for private meetings) */}
                {isPrivate && meetingPin && (
                  <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium text-foreground">PIN de la réunion</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-card px-3 py-2 rounded text-lg font-mono font-bold text-center text-foreground">
                        {meetingPin}
                      </code>
                      <button
                        onClick={handleCopyPin}
                        className="text-primary hover:text-primary/80 transition-colors p-1"
                        title="Copy PIN"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Les participants auront besoin de ce PIN pour rejoindre la réunion
                    </p>
                  </div>
                )}

                {/* Security Information */}
                <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {isPrivate
                      ? "Les personnes utilisant le lien de cette réunion doivent obtenir votre autorisation et entrer le PIN pour y participer."
                      : "Les personnes utilisant le lien de cette réunion peuvent y participer directement."}
                  </p>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

