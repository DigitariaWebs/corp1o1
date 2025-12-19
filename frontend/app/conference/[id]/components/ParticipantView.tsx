"use client";
import { useState } from "react";
import { 
  useCallStateHooks,
  ParticipantView as StreamParticipantView,
  PaginatedGridLayout
} from "@stream-io/video-react-sdk";
import { Grid3x3, Maximize2, Users, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MeetingControls from "./MeetingControls";

interface ParticipantViewProps {
  call: any;
  camEnabled: boolean;
  micEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export default function ParticipantView({
  call,
  camEnabled,
  micEnabled,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onLeave,
}: ParticipantViewProps) {
  const { useParticipants, useScreenShareState } = useCallStateHooks();
  const participants = useParticipants();
  const { isEnabled: isLocalScreenShare, screenShare } = useScreenShareState();
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("speaker");

  const localParticipant = participants.find((p: any) => p.isLocalParticipant);
  
  // Find screen sharing participant using Stream SDK's recommended approach
  const screenSharingParticipant = participants.find((p: any) => {
    // Check if participant has screen share track published
    const hasScreenShare = p.publishedTracks?.some((track: any) => {
      if (typeof track === 'string') {
        return track.toLowerCase().includes('screen') || track === 'screen_share';
      }
      if (track?.type) {
        return track.type === 'screen_share' || track.type === 'video' && track.name?.includes('screen');
      }
      return false;
    });
    
    // Also check if local participant is actively screen sharing
    if (p.isLocalParticipant && isLocalScreenShare) {
      return true;
    }
    
    // Check for screenShareStream property
    if (p.screenShareStream) {
      return true;
    }
    
    return hasScreenShare;
  });
  
  // Main participant is screen sharer or first remote participant
  const mainParticipant = screenSharingParticipant || participants.find((p: any) => !p.isLocalParticipant) || localParticipant;
  
  // Check if main participant is screen sharing
  const isMainParticipantScreenSharing = mainParticipant && (
    !!mainParticipant.screenShareStream ||
    (mainParticipant.isLocalParticipant && isLocalScreenShare) ||
    (mainParticipant.publishedTracks && mainParticipant.publishedTracks.some((t: any) => 
      typeof t === 'string' && t.toLowerCase().includes('screen')
    ))
  );
  
  const getParticipantInfo = (participant: any) => {
    const name = participant.name || participant.user?.name || participant.userId || "Participant";
    const image = participant.image || participant.user?.image || undefined;
    const isMuted = participant.isAudioMuted || participant.audioTrack?.muted || !participant.hasAudio;
    const hasVideo = participant.videoTrack && !participant.isVideoMuted && participant.hasVideo;
    return { name, image, isMuted, hasVideo };
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative bg-gradient-to-br from-background via-background to-card pb-32">
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between gap-4">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "speaker" : "grid")}
            className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-foreground hover:bg-primary/20 transition-all backdrop-blur-sm bg-card/50"
            title={viewMode === "grid" ? "Switch to Speaker View" : "Switch to Grid View"}
          >
            {viewMode === "grid" ? (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Speaker View</span>
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
            {/* Main Participant Video - Centered */}
            {mainParticipant ? (
              <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden bg-card/50 shadow-2xl border-2 border-primary/20" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
                {/* Screen Sharing Badge */}
                {isMainParticipantScreenSharing && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <Badge className="bg-green-600/80 text-white text-xs px-2 py-0.5">
                      <Monitor className="h-3 w-3 mr-1" />
                      {mainParticipant.isLocalParticipant ? 'You are sharing' : `${mainParticipant.name || 'Participant'} is sharing`}
                    </Badge>
                  </div>
                )}
                
                {/* Render screen share if available, otherwise show video */}
                {isMainParticipantScreenSharing ? (
                  <ScreenShareView participant={mainParticipant} />
                ) : (
                  <div className="h-full w-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover">
                    <StreamParticipantView
                      participant={mainParticipant}
                      key={mainParticipant.sessionId}
                      className="h-full w-full"
                    />
                  </div>
                )}
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
            {participants
              .filter((p: any) => p.sessionId !== mainParticipant?.sessionId)
              .map((participant: any) => {
                const info = getParticipantInfo(participant);
                const initials = info.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                
                return (
                  <div
                    key={participant.sessionId}
                    className="group relative rounded-xl overflow-hidden bg-card/50 border border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-card">
                      {info.hasVideo ? (
                        <StreamParticipantView
                          participant={participant}
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-card/50">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold border-2 border-primary/30">
                            {initials}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 bg-card/80 backdrop-blur-sm">
                      <p className="text-sm font-medium text-foreground truncate">
                        {info.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            
            {participants.filter((p: any) => p.sessionId !== mainParticipant?.sessionId).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No other participants</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <MeetingControls
        micEnabled={micEnabled}
        camEnabled={camEnabled}
        isScreenSharing={isLocalScreenShare}
        onToggleMic={onToggleMic}
        onToggleCamera={onToggleCamera}
        onToggleScreenShare={onToggleScreenShare}
        onLeave={onLeave}
      />
    </div>
  );
}

// Screen Share View Component - Uses Stream SDK's ParticipantView with TrackType
function ScreenShareView({ participant }: { participant: any }) {
  // Use Stream SDK's ParticipantView which automatically renders screen share tracks
  // According to Stream docs: ParticipantView can automatically render screen share video track
  return (
    <div className="h-full w-full relative bg-black">
      <StreamParticipantView
        participant={participant}
        className="h-full w-full"
        // ParticipantView will automatically detect and render screen share track
      />
    </div>
  );
}

