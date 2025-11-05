"use client";
import { useState, useEffect, useRef } from "react";
import { VideoIcon, VideoOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JoinPreviewProps {
  camEnabled: boolean;
  micEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onJoin: () => void;
  onCancel: () => void;
  showPinModal: boolean;
  pinInput: string;
  pinError: string;
  onPinChange: (value: string) => void;
  onPinSubmit: (e?: React.FormEvent) => void;
  onClosePinModal: () => void;
}

export default function JoinPreview({
  camEnabled,
  micEnabled,
  onToggleCamera,
  onToggleMic,
  onJoin,
  onCancel,
  showPinModal,
  pinInput,
  pinError,
  onPinChange,
  onPinSubmit,
  onClosePinModal,
}: JoinPreviewProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const streamInitialized = useRef(false);

  // Get user's media stream for preview
  useEffect(() => {
    if (typeof window === 'undefined' || streamInitialized.current) return;

    let stream: MediaStream | null = null;
    let isMounted = true;
    streamInitialized.current = true;
    
    const getMediaStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      streamInitialized.current = false;
    };
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (videoElement && localStream) {
      videoElement.srcObject = localStream;
    }
  }, [videoElement, localStream]);

  // Update track states when camEnabled/micEnabled changes
  useEffect(() => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    const audioTrack = localStream.getAudioTracks()[0];
    if (videoTrack) videoTrack.enabled = camEnabled;
    if (audioTrack) audioTrack.enabled = micEnabled;
  }, [camEnabled, micEnabled, localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

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
        </div>

        {/* PIN Modal */}
        {showPinModal && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full fade-in-up">
              <h2 className="text-2xl font-bold mb-4 gradient-text text-center">Enter Meeting PIN</h2>
              <p className="text-muted-foreground mb-6 text-center">
                This is a private meeting. Please enter the 4-digit PIN to join.
              </p>
              <form onSubmit={onPinSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      onPinChange(value);
                    }}
                    className="w-full text-center text-3xl font-mono font-bold py-4 px-6 bg-card/50 border-2 border-primary/30 rounded-xl focus:border-primary focus:outline-none"
                    placeholder="0000"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-red-500 text-sm mt-2 text-center">{pinError}</p>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={onClosePinModal}
                    className="flex-1 btn-secondary px-6 py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pinInput.length !== 4}
                    className="flex-1 btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join and Cancel Buttons */}
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onJoin} 
            className="btn-primary px-8 py-3 text-base"
          >
            Join Conference
          </button>
          <button 
            onClick={onCancel} 
            className="btn-secondary px-8 py-3 text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}

