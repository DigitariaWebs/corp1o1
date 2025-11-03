"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  StreamCall, 
  StreamTheme, 
  PaginatedGridLayout, 
  CallControls,
  SpeakerLayout,
  useCallStateHooks,
  ParticipantView
} from "@stream-io/video-react-sdk";
import { useGetCallById } from "@/app/hooks/useGetCallById";
import { Grid3x3, Maximize2 } from "lucide-react";

export default function FaceTimePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "pip">("grid");

  // Fetch the call details using our custom hook
  const { call, isCallLoading } = useGetCallById(id);

  // Side effect: toggle camera/mic based on camEnabled state
  useEffect(() => {
    if (call && confirmJoin) {
      if (camEnabled) {
        call.camera.enable().catch(err => console.error("Error enabling camera:", err));
        call.microphone.enable().catch(err => console.error("Error enabling microphone:", err));
      } else {
        call.camera.disable().catch(err => console.error("Error disabling camera:", err));
        call.microphone.disable().catch(err => console.error("Error disabling microphone:", err));
      }
    }
  }, [call, camEnabled, confirmJoin]);

  // Handle the user confirming they want to join
  const handleJoin = async () => {
    if (!call || !user) {
      alert("Please wait for the call to load and ensure you're signed in.");
      return;
    }
    try {
      await call.join();
      setConfirmJoin(true);
      setCamEnabled(true);
    } catch (err: any) {
      console.error("Join call error", err);
      alert(`Failed to join the call: ${err.message || "Unknown error"}`);
    }
  };

  // Wait for user to be loaded
  if (!userLoaded) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </main>
    );
  }

  if (isCallLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading call details...</p>
        </div>
      </main>
    );
  }

  if (!call) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Call not found</h1>
          <p className="text-muted-foreground mb-6">The call you're looking for doesn't exist or has ended.</p>
          <button 
            onClick={() => router.push("/")} 
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  // If user hasn't confirmed joining yet, show a prompt
  if (!confirmJoin) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center fade-in-up">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Join FaceTime Call</h1>
          <p className="text-muted-foreground mb-8">Ready to connect with your team?</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={handleJoin} 
              className="btn-primary px-8 py-3 text-base"
            >
              Join Call
            </button>
            <button 
              onClick={() => router.push("/")} 
              className="btn-secondary px-8 py-3 text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Main meeting UI component
  const MeetingContent = () => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = participants.find((p: any) => p.isLocalParticipant);
    const remoteParticipants = participants.filter((p: any) => !p.isLocalParticipant);
    
    // For picture-in-picture, show main speaker fullscreen and local participant as small overlay
    const mainParticipant = remoteParticipants[0] || localParticipant;

    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* View Mode Toggle */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "pip" : "grid")}
            className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-foreground hover:bg-primary/20 transition-all"
            title={viewMode === "grid" ? "Switch to Picture-in-Picture" : "Switch to Grid View"}
          >
            {viewMode === "grid" ? (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">PIP Mode</span>
              </>
            ) : (
              <>
                <Grid3x3 className="h-4 w-4" />
                <span className="hidden sm:inline">Grid View</span>
              </>
            )}
          </button>
        </div>

        {/* Main Video Area */}
        {viewMode === "grid" ? (
          <div className="relative h-screen w-full pt-16 pb-32">
            <PaginatedGridLayout />
          </div>
        ) : (
          <div className="relative h-screen w-full pt-16 pb-32">
            {/* Main participant video (fullscreen) */}
            {mainParticipant ? (
              <div className="relative h-full w-full bg-card/50">
                <ParticipantView
                  participant={mainParticipant}
                  key={mainParticipant.sessionId}
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-muted-foreground">Waiting for participants...</p>
                </div>
              </div>
            )}

            {/* Picture-in-Picture: Local participant overlay */}
            {localParticipant && localParticipant !== mainParticipant && (
              <div className="absolute bottom-32 right-4 w-64 h-48 rounded-xl overflow-hidden border-2 border-primary/30 shadow-2xl bg-card/90 backdrop-blur-sm z-40 transition-all hover:border-primary/50">
                <div className="absolute top-2 left-2 z-10 bg-black/50 rounded-full p-1">
                  <span className="text-xs text-white px-2 py-1">You</span>
                </div>
                <ParticipantView
                  participant={localParticipant}
                  key={localParticipant.sessionId}
                  className="h-full w-full"
                />
              </div>
            )}

            {/* Additional participants thumbnails (if more than 2) */}
            {remoteParticipants.length > 1 && (
              <div className="absolute top-20 right-4 flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {remoteParticipants.slice(1).map((participant: any) => (
                  <div
                    key={participant.sessionId}
                    className="w-32 h-24 rounded-lg overflow-hidden border border-primary/20 bg-card/90 backdrop-blur-sm cursor-pointer hover:border-primary/50 transition-all"
                  >
                    <ParticipantView
                      participant={participant}
                      className="h-full w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Call Controls */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-primary/20 py-4">
          <div className="flex items-center justify-center">
            <CallControls 
              onLeave={() => {
                if (confirm("Leave the call?")) {
                  call.leave();
                  router.push("/");
                }
              }} 
            />
          </div>
        </div>
      </div>
    );
  };

  // If confirmed (user has joined), render the meeting UI
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <StreamCall call={call}>
        <StreamTheme>
          <MeetingContent />
        </StreamTheme>
      </StreamCall>
    </main>
  );
}
