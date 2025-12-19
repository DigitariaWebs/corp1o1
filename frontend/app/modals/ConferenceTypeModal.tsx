"use client";
import { useState, Fragment, useEffect } from "react";
import { Dialog, DialogTitle, DialogPanel, Transition, TransitionChild, Description } from "@headlessui/react";
import { Lock, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

interface ConferenceTypeModalProps {
  enable: boolean;
  setEnable: (enable: boolean) => void;
  onSelect: (type: "public" | "private", pin?: string, conferenceId?: string) => void;
}

export default function ConferenceTypeModal({ enable, setEnable, onSelect }: ConferenceTypeModalProps) {
  const [conferenceType, setConferenceType] = useState<"public" | "private">("public");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useUser();

  // Reset state when modal opens
  useEffect(() => {
    if (enable) {
      setConferenceType("public");
      setPin("");
      setPinError("");
    }
  }, [enable]);

  // Generate 4-digit PIN
  const generatePin = () => {
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(generatedPin);
    setPinError("");
    return generatedPin;
  };

  // Handle type change
  const handleTypeChange = (type: "public" | "private") => {
    setConferenceType(type);
    if (type === "private" && !pin) {
      generatePin();
    }
  };

  // Handle PIN input
  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 4);
    setPin(numericValue);
    setPinError("");
  };

  // Handle continue - Create conference in backend immediately
  const handleContinue = async () => {
    if (conferenceType === "private") {
      if (!pin || pin.length !== 4) {
        setPinError("Please generate or enter a 4-digit PIN");
        return;
      }
    }

    setIsCreating(true);
    setPinError(""); // Clear previous errors
    
    try {
      // Check if user is available
      if (!user?.id) {
        throw new Error("User not authenticated. Please sign in to create a conference.");
      }
      
      // Generate conference ID
      const conferenceId = crypto.randomUUID();
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const apiUrl = `${backendUrl}/api/conferences`;
      
      console.log("Creating conference in backend:", {
        url: apiUrl,
        conferenceId,
        hasPassword: conferenceType === "private",
        userId: user.id,
      });
      
      const requestBody = {
        id: conferenceId,
        hasPassword: conferenceType === "private",
        createdBy: user.id, // Always use user.id (Clerk user ID)
        ...(conferenceType === "private" && { pin: pin }),
      };
      
      console.log("Request body:", { ...requestBody, pin: conferenceType === "private" ? "***" : undefined });
      
      const createConferenceResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Conference creation response status:", createConferenceResponse.status);

      if (!createConferenceResponse.ok) {
        const errorData = await createConferenceResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.error("Conference creation failed:", errorData);
        throw new Error(errorData.message || errorData.error || `Failed to create conference (${createConferenceResponse.status})`);
      }

      const responseData = await createConferenceResponse.json();
      console.log("Conference created successfully:", responseData);

      // Store conference creation info in sessionStorage so the conference page knows user is host
      if (typeof window !== 'undefined') {
        try {
          const conferenceCreatorInfo = {
            conferenceId: conferenceId,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
          };
          sessionStorage.setItem(`conference_creator_${conferenceId}`, JSON.stringify(conferenceCreatorInfo));
          console.log('✅ Stored conference creator info in sessionStorage:', conferenceCreatorInfo);
        } catch (error) {
          console.error('Failed to store conference creator info:', error);
        }
      }

      // Call onSelect with conference ID - parent will handle closing this modal
      onSelect(conferenceType, conferenceType === "private" ? pin : undefined, conferenceId);
    } catch (error: any) {
      console.error("Error creating conference:", error);
      const errorMessage = error.message || "Failed to create conference. Please try again.";
      setPinError(errorMessage);
      alert(`Error: ${errorMessage}`); // Show alert for debugging
    } finally {
      setIsCreating(false);
    }
  };

  if (!enable) return null;

  return (
    <Transition appear show={enable} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={() => setEnable(false)}>
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
                    Choose Conference Type
                  </DialogTitle>
                  <button
                    onClick={() => setEnable(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <Description className="text-sm text-muted-foreground mb-6">
                  Select whether your conference should be public (anyone can join) or private (PIN protected)
                </Description>

                {/* Conference Type Selection */}
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("public")}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      conferenceType === "public"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className={`h-6 w-6 ${conferenceType === "public" ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <div className="font-semibold text-foreground">Public Conference</div>
                        <div className="text-sm text-muted-foreground">
                          Anyone with the link can join
                        </div>
                      </div>
                      {conferenceType === "public" && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange("private")}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      conferenceType === "private"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className={`h-6 w-6 ${conferenceType === "private" ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <div className="font-semibold text-foreground">Private Conference</div>
                        <div className="text-sm text-muted-foreground">
                          Protected with a 4-digit PIN
                        </div>
                      </div>
                      {conferenceType === "private" && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* PIN Section for Private */}
                {conferenceType === "private" && (
                  <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Meeting PIN
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        className="flex-1 text-center text-2xl font-mono font-bold py-3 px-4 bg-card border-2 border-primary/30 rounded-lg focus:border-primary focus:outline-none"
                        placeholder="0000"
                      />
                      <Button
                        type="button"
                        onClick={generatePin}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        Generate
                      </Button>
                    </div>
                    {pinError && (
                      <p className="text-red-500 text-xs mt-1">{pinError}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this PIN with participants to join the meeting
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEnable(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={isCreating}
                    className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Creating..." : "Continue"}
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

