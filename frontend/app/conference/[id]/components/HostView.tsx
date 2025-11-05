"use client";
import { useState } from "react";
import { 
  useCallStateHooks,
  ParticipantView,
  PaginatedGridLayout
} from "@stream-io/video-react-sdk";
import { Grid3x3, Maximize2, Crown, Monitor, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShareMeeting from "@/app/modals/ShareMeeting";
import MeetingControls from "./MeetingControls";

interface HostViewProps {
  call: any;
  meetingId: string;
  camEnabled: boolean;
  micEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export default function HostView({
  call,
  meetingId,
  camEnabled,
  micEnabled,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onLeave,
}: HostViewProps) {
  const { useParticipants, useScreenShareState } = useCallStateHooks();
  const participants = useParticipants();
  const { isEnabled: isLocalScreenShare, screenShare } = useScreenShareState();
  const [viewMode, setViewMode] = useState<"grid" | "host">("host");
  const [showShareModal, setShowShareModal] = useState(false);

  const localParticipant = participants.find((p: any) => p.isLocalParticipant);
  const remoteParticipants = participants.filter((p: any) => !p.isLocalParticipant);
  
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
  
  // Host is always the local participant (creator), but prioritize screen sharer
  const hostParticipant = screenSharingParticipant || localParticipant;
  const isHostScreenSharing = hostParticipant && (
    !!hostParticipant.screenShareStream || 
    (hostParticipant.isLocalParticipant && isLocalScreenShare) ||
    hostParticipant.publishedTracks?.some((track: any) => {
      if (typeof track === 'string') {
        return track.toLowerCase().includes('screen') || track === 'screen_share';
      }
      if (track?.type) {
        return track.type === 'screen_share';
      }
      return false;
    })
  );
  
  const sidebarParticipants = participants.filter((p: any) => p.sessionId !== hostParticipant?.sessionId);
  
  const getParticipantInfo = (participant: any) => {
    const name = participant.name || participant.user?.name || participant.userId || "Participant";
    const image = participant.image || participant.user?.image || undefined;
    const isMuted = participant.isAudioMuted || participant.audioTrack?.muted || !participant.hasAudio;
    const hasVideo = participant.videoTrack && !participant.isVideoMuted && participant.hasVideo;
    const isLocal = participant.isLocalParticipant;
    return { name, image, isMuted, hasVideo, isLocal };
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex">
      {/* Main Content Area - Host Video Centered */}
      <div className="flex-1 flex items-center justify-center relative bg-gradient-to-br from-background via-background to-card pb-32 pr-0 lg:pr-80">
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between gap-4">
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
          
          {/* Share Button (Host Only) */}
          <Button
            onClick={() => setShowShareModal(true)}
            variant="outline"
            className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-foreground hover:bg-primary/20 transition-all backdrop-blur-sm bg-card/50 border-primary/20"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>

        {viewMode === "grid" ? (
          <div className="relative h-full w-full pt-16">
            <PaginatedGridLayout />
          </div>
        ) : (
          <div className="relative w-full max-w-6xl mx-auto px-4">
            {/* Host Video - Centered */}
            {hostParticipant ? (
              <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden bg-card/50 shadow-2xl border-2 border-primary/20" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
                {/* Host Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">
                    You (Host)
                  </span>
                  {isHostScreenSharing && (
                    <Badge className="bg-green-600/80 text-white text-xs px-2 py-0.5 ml-2">
                      <Monitor className="h-3 w-3 mr-1" />
                      Sharing Screen
                    </Badge>
                  )}
                </div>
                
                {/* Render screen share if available, otherwise show video */}
                {isHostScreenSharing ? (
                  <ScreenShareView participant={hostParticipant} />
                ) : (
                  <div className="h-full w-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover">
                    <ParticipantView
                      participant={hostParticipant}
                      key={`${hostParticipant.sessionId}-video`}
                      className={`h-full w-full ${
                        hostParticipant.isLocalParticipant 
                          ? '[&_video]:scale-x-[-1]' 
                          : ''
                      }`}
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
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold border-2 border-primary/30">
                          {initials}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Participant Name */}
                  <div className="p-3 bg-card/80 backdrop-blur-sm">
                    <p className="text-sm font-medium text-foreground truncate">
                      {info.name}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {sidebarParticipants.length === 0 && (
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

      {/* Share Meeting Modal */}
      {call && (
        <ShareMeeting
          enable={showShareModal}
          setEnable={setShowShareModal}
          meetingLink={typeof window !== 'undefined' ? `${window.location.origin}/conference/${meetingId}` : ''}
          meetingPin={call?.state?.custom?.pin}
          isPrivate={call?.state?.custom?.conferenceType === "private"}
        />
      )}
    </div>
  );
}

// Screen Share View Component - Uses Stream SDK's ParticipantView with TrackType
function ScreenShareView({ participant }: { participant: any }) {
  // Use Stream SDK's ParticipantView which automatically renders screen share tracks
  // According to Stream docs: ParticipantView can automatically render screen share video track
  return (
    <div className="h-full w-full relative bg-black">
      <ParticipantView
        participant={participant}
        className="h-full w-full"
        // ParticipantView will automatically detect and render screen share track
      />
    </div>
  );
}

