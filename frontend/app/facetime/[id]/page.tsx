"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  StreamCall, 
  StreamTheme, 
  PaginatedGridLayout, 
  SpeakerLayout,
  useCallStateHooks,
  ParticipantView
} from "@stream-io/video-react-sdk";
import { useGetCallById } from "@/app/hooks/useGetCallById";
import { Grid3x3, Maximize2, Mic, MicOff, VideoIcon, VideoOff, PhoneOff, Monitor, Crown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function FaceTimePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "host">("host");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const streamInitialized = useRef(false);

  // Fetch the call details using our custom hook
  const { call, isCallLoading } = useGetCallById(id);

  // Get user's media stream for preview before joining
  useEffect(() => {
    if (confirmJoin || isCallLoading || !call || typeof window === 'undefined' || streamInitialized.current) {
      return;
    }

    let stream: MediaStream | null = null;
    let isMounted = true;
    streamInitialized.current = true;
    
    const getMediaStream = async () => {
      try {
        // Always request both video and audio, we'll enable/disable tracks
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // Set initial track states based on camEnabled and micEnabled
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        if (videoTrack) videoTrack.enabled = camEnabled;
        if (audioTrack) audioTrack.enabled = micEnabled;
        
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        streamInitialized.current = false;
      }
    };

    getMediaStream();

    return () => {
      isMounted = false;
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      streamInitialized.current = false;
    };
  }, [confirmJoin, isCallLoading, call]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoElement && localStream) {
      videoElement.srcObject = localStream;
    }
  }, [videoElement, localStream]);

  // Cleanup stream on unmount or when confirmJoin changes
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream, confirmJoin]);

  // Toggle camera for preview
  const togglePreviewCamera = () => {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const newState = !camEnabled;
      videoTrack.enabled = newState;
      setCamEnabled(newState);
    }
  };

  // Toggle microphone for preview
  const togglePreviewMic = () => {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      const newState = !micEnabled;
      audioTrack.enabled = newState;
      setMicEnabled(newState);
    }
  };

  // Side effect: toggle camera/mic based on camEnabled and micEnabled states
  useEffect(() => {
    if (call && confirmJoin) {
      if (camEnabled) {
        call.camera.enable().catch(err => console.error("Error enabling camera:", err));
      } else {
        call.camera.disable().catch(err => console.error("Error disabling camera:", err));
      }
    }
  }, [call, camEnabled, confirmJoin]);

  useEffect(() => {
    if (call && confirmJoin) {
      if (micEnabled) {
        call.microphone.enable().catch(err => console.error("Error enabling microphone:", err));
      } else {
        call.microphone.disable().catch(err => console.error("Error disabling microphone:", err));
      }
    }
  }, [call, micEnabled, confirmJoin]);

  // Toggle camera function
  const toggleCamera = async () => {
    if (!call) return;
    try {
      if (camEnabled) {
        await call.camera.disable();
        setCamEnabled(false);
      } else {
        await call.camera.enable();
        setCamEnabled(true);
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };

  // Toggle microphone function
  const toggleMicrophone = async () => {
    if (!call) return;
    try {
      if (micEnabled) {
        await call.microphone.disable();
        setMicEnabled(false);
      } else {
        await call.microphone.enable();
        setMicEnabled(true);
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  // Leave call function
  const handleLeaveCall = async () => {
    if (confirm("Leave the call?")) {
      try {
        if (call) {
          await call.leave();
        }
        router.push("/");
      } catch (error) {
        console.error("Error leaving call:", error);
      }
    }
  };

  // Handle the user confirming they want to join
  const handleJoin = async () => {
    if (!call || !user) {
      alert("Please wait for the call to load and ensure you're signed in.");
      return;
    }
    try {
      // Stop preview stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      await call.join();
      setConfirmJoin(true);
      
      // Set camera and mic based on user's preference
      if (camEnabled) {
        await call.camera.enable();
      } else {
        await call.camera.disable();
      }
      
      if (micEnabled) {
        await call.microphone.enable();
      } else {
        await call.microphone.disable();
      }
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
        <div className="glass-card p-8 max-w-2xl w-full fade-in-up">
          <h1 className="text-3xl font-bold mb-2 gradient-text text-center">Join Conference</h1>
          <p className="text-muted-foreground mb-6 text-center">Ready to connect with your team?</p>
          
          {/* Video Preview */}
          <div className="relative mb-6 rounded-xl overflow-hidden bg-card/50 aspect-video">
            {camEnabled ? (
              <video
                ref={setVideoElement}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-card/80">
                <div className="text-center">
                  <VideoOff className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Camera is off</p>
                </div>
              </div>
            )}
          </div>

          {/* Camera and Mic Toggle Controls */}
          <div className="flex gap-4 justify-center mb-6">
            <Button
              variant={camEnabled ? "default" : "destructive"}
              size="lg"
              onClick={togglePreviewCamera}
              className="rounded-full w-14 h-14"
            >
              {camEnabled ? (
                <VideoIcon className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={micEnabled ? "default" : "destructive"}
              size="lg"
              onClick={togglePreviewMic}
              className="rounded-full w-14 h-14"
            >
              {micEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Join and Cancel Buttons */}
          <div className="flex gap-4 justify-center">
            <button 
              onClick={handleJoin} 
              className="btn-primary px-8 py-3 text-base"
            >
              Join Conference
            </button>
            <button 
              onClick={() => {
                if (localStream) {
                  localStream.getTracks().forEach(track => track.stop());
                }
                router.push("/");
              }} 
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
    const { useParticipants, useScreenShareState } = useCallStateHooks();
    const participants = useParticipants();
    const { screenShare, isEnabled: isLocalScreenShare } = useScreenShareState();
    const localParticipant = participants.find((p: any) => p.isLocalParticipant);
    const remoteParticipants = participants.filter((p: any) => !p.isLocalParticipant);
    
    // Determine host - prioritize screen share, then main speaker, then local participant
    const screenSharingParticipant = participants.find((p: any) => {
      const tracks = p.publishedTracks || [];
      return tracks.includes("screen_share") || tracks.includes("screenShare") || p.screenShareStream;
    });
    const hostParticipant = screenSharingParticipant || remoteParticipants[0] || localParticipant;
    
    // All participants except host for the sidebar
    const sidebarParticipants = participants.filter((p: any) => p.sessionId !== hostParticipant?.sessionId);
    
    // Get participant info helper
    const getParticipantInfo = (participant: any) => {
      const name = participant.name || participant.user?.name || participant.userId || "Participant";
      const image = participant.image || participant.user?.image || undefined;
      // Check if muted - Stream SDK participants have these properties
      const isMuted = participant.isAudioMuted || participant.audioTrack?.muted || !participant.hasAudio;
      // Check if has video
      const hasVideo = participant.videoTrack && !participant.isVideoMuted && participant.hasVideo;
      const isLocal = participant.isLocalParticipant;
      return { name, image, isMuted, hasVideo, isLocal };
    };
    
    // Toggle screen sharing
    const toggleScreenShare = async () => {
      if (!call) return;
      try {
        await call.screenShare.toggle();
      } catch (error) {
        console.error("Error toggling screen share:", error);
        alert("Failed to toggle screen sharing. Make sure you're on a desktop browser.");
      }
    };

    return (
      <div className="relative min-h-screen w-full overflow-hidden flex">
        {/* Main Content Area - Host Video Centered */}
        <div className="flex-1 flex items-center justify-center relative bg-gradient-to-br from-background via-background to-card pb-32 pr-0 lg:pr-80">
          {/* View Mode Toggle */}
          <div className="absolute top-4 left-4 z-50">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "host" : "grid")}
              className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-foreground hover:bg-primary/20 transition-all backdrop-blur-sm bg-card/50"
              title={viewMode === "grid" ? "Switch to Host View" : "Switch to Grid View"}
            >
              {viewMode === "grid" ? (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Host View</span>
                </>
              ) : (
                <>
                  <Grid3x3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid View</span>
                </>
              )}
            </button>
          </div>

          {viewMode === "grid" ? (
            <div className="relative h-full w-full pt-16">
              <PaginatedGridLayout />
            </div>
          ) : (
            <div className="relative w-full max-w-6xl mx-auto px-4">
              {/* Host Video - Centered */}
              {hostParticipant ? (
                <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden bg-card/50 shadow-2xl border-2 border-primary/20">
                  {/* Host Badge */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <Crown className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium text-white">
                      {hostParticipant.isLocalParticipant ? "You (Host)" : `${getParticipantInfo(hostParticipant).name} (Host)`}
                    </span>
                  </div>
                  
                  <ParticipantView
                    participant={hostParticipant}
                    key={hostParticipant.sessionId}
                    className={`h-full w-full ${hostParticipant.isLocalParticipant ? '[&_video]:scale-x-[-1]' : ''}`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👤</div>
                    <p className="text-muted-foreground">Waiting for participants...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Participants Sidebar - Right Side */}
        <div className="hidden lg:flex fixed right-0 top-0 bottom-32 w-80 bg-card/80 backdrop-blur-xl border-l border-primary/20 z-40 overflow-y-auto flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </h3>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {participants.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {sidebarParticipants.map((participant: any) => {
                const info = getParticipantInfo(participant);
                const initials = info.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                
                return (
                  <div
                    key={participant.sessionId}
                    className="group relative rounded-xl overflow-hidden bg-card/50 border border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    {/* Participant Video/Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-card">
                      {info.hasVideo ? (
                        <ParticipantView
                          participant={participant}
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-card/50">
                          <Avatar className="w-20 h-20 border-2 border-primary/30">
                            <AvatarImage src={info.image} alt={info.name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      
                      {/* Status Overlays */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        {info.isLocal && (
                          <Badge className="bg-primary/80 text-white text-xs px-2 py-0.5">
                            You
                          </Badge>
                        )}
                      </div>
                      
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        {info.isMuted && (
                          <div className="bg-red-500/80 rounded-full p-1.5">
                            <MicOff className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {!info.hasVideo && (
                          <div className="bg-gray-500/80 rounded-full p-1.5">
                            <VideoOff className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Participant Name */}
                    <div className="p-3 bg-card/80 backdrop-blur-sm">
                      <p className="text-sm font-medium text-foreground truncate">
                        {info.name}
                      </p>
                      {info.isLocal && (
                        <p className="text-xs text-muted-foreground">Local</p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {sidebarParticipants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No other participants</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-primary/20 py-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={micEnabled ? "default" : "destructive"}
              size="lg"
              onClick={toggleMicrophone}
              className="rounded-full w-14 h-14"
            >
              {micEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={camEnabled ? "default" : "destructive"}
              size="lg"
              onClick={toggleCamera}
              className="rounded-full w-14 h-14"
            >
              {camEnabled ? (
                <VideoIcon className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={isLocalScreenShare ? "default" : "outline"}
              size="lg"
              onClick={toggleScreenShare}
              className={`rounded-full w-14 h-14 ${isLocalScreenShare ? "bg-green-600 hover:bg-green-700" : "border-white/20 hover:bg-white/10"}`}
              title="Share Screen"
            >
              <Monitor className="h-5 w-5" />
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleLeaveCall}
              className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
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
