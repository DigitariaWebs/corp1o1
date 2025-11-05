"use client";
import { Mic, MicOff, VideoIcon, VideoOff, PhoneOff, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeetingControlsProps {
  micEnabled: boolean;
  camEnabled: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export default function MeetingControls({
  micEnabled,
  camEnabled,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: MeetingControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-primary/20 py-4">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={micEnabled ? "default" : "destructive"}
          size="lg"
          onClick={onToggleMic}
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
          onClick={onToggleCamera}
          className="rounded-full w-14 h-14"
        >
          {camEnabled ? (
            <VideoIcon className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="lg"
          onClick={onToggleScreenShare}
          className={`rounded-full w-14 h-14 ${isScreenSharing ? "bg-green-600 hover:bg-green-700" : "border-white/20 hover:bg-white/10"}`}
          title="Share Screen"
        >
          <Monitor className="h-5 w-5" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={onLeave}
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

