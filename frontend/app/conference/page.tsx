"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { 
  StreamCall, 
  StreamTheme, 
  PaginatedGridLayout, 
  CallControls,
  SpeakerLayout
} from "@stream-io/video-react-sdk";
import { 
  Video, 
  Users, 
  Plus, 
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  PhoneOff,
  Maximize2,
  Grid3x3,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainNavigation } from "@/components/navigation/main-navigation";
import { useToast } from "@/hooks/use-toast";
import InstantMeeting from "@/app/modals/InstantMeeting";
import JoinMeeting from "@/app/modals/JoinMeeting";


export default function ConferencePage() {
  const { user, isLoaded: userLoaded } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();
  
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");

  // Create or join a conference
  const createConference = async (instant: boolean = false) => {
    if (!client || !user) {
      toast({
        title: "Error",
        description: "Please wait for client to initialize",
        variant: "destructive",
      });
      return;
    }

    try {
      const id = crypto.randomUUID();
      const call = client.call("default", id);
      
      if (!call) {
        throw new Error("Failed to create conference");
      }

      await call.getOrCreate({
        data: {
          starts_at: instant ? new Date().toISOString() : undefined,
          custom: {
            description: `Conference created by ${user.fullName || user.email}`,
          },
        },
      });

      setCallId(id);
      setActiveCall(call);
      setIsInCall(true);
      
      // Auto-join the call
      await call.join();
      
      toast({
        title: "Success",
        description: "Conference created and joined successfully!",
      });
    } catch (error: any) {
      console.error("Error creating conference:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create conference",
        variant: "destructive",
      });
    }
  };

  const leaveConference = async () => {
    if (activeCall) {
      try {
        await activeCall.leave();
        setIsInCall(false);
        setActiveCall(null);
        setCallId(null);
        toast({
          title: "Left Conference",
          description: "You have left the conference",
        });
      } catch (error: any) {
        console.error("Error leaving conference:", error);
      }
    }
  };

  const copyConferenceLink = () => {
    if (!callId) return;
    const link = `${window.location.origin}/facetime/${callId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Conference link copied to clipboard",
    });
  };

  const toggleCamera = async () => {
    if (!activeCall) return;
    try {
      if (camEnabled) {
        await activeCall.camera.disable();
        setCamEnabled(false);
      } else {
        await activeCall.camera.enable();
        setCamEnabled(true);
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };

  const toggleMicrophone = async () => {
    if (!activeCall) return;
    try {
      if (micEnabled) {
        await activeCall.microphone.disable();
        setMicEnabled(false);
      } else {
        await activeCall.microphone.enable();
        setMicEnabled(true);
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If user is in a call, show the video conference UI
  if (isInCall && activeCall && callId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <StreamCall call={activeCall}>
          <StreamTheme>
            <div className="relative h-screen w-full flex flex-col">
              {/* Top bar with conference info and controls */}
              <div className="absolute top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm border-b border-gray-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">Conference</h2>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyConferenceLink}
                    className="text-white hover:bg-gray-800"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "speaker" : "grid")}
                    className="text-white hover:bg-gray-800"
                  >
                    {viewMode === "grid" ? (
                      <>
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Speaker
                      </>
                    ) : (
                      <>
                        <Grid3x3 className="h-4 w-4 mr-2" />
                        Grid
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Video area */}
              <div className="flex-1 relative overflow-hidden pt-16">
                {viewMode === "grid" ? (
                  <PaginatedGridLayout />
                ) : (
                  <SpeakerLayout />
                )}
              </div>

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm border-t border-gray-800 p-4">
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
                    variant="destructive"
                    size="lg"
                    onClick={leaveConference}
                    className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Stream's built-in controls (hidden by default, can be toggled) */}
                <div className="mt-2 flex justify-center">
                  <CallControls onLeave={leaveConference} />
                </div>
              </div>
            </div>
          </StreamTheme>
        </StreamCall>
      </div>
    );
  }

  // Main conference dashboard (not in call)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <MainNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Video Conference</h1>
          <p className="text-gray-400">Start or join a video conference with your team</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer"
                onClick={() => {
                  setShowInstantModal(true);
                  createConference(true);
                }}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-5 w-5 text-green-400" />
                <CardTitle className="text-white">Instant Meeting</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Start a meeting right now
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer"
                onClick={() => setShowJoinModal(true)}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Join Meeting</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Join with a meeting link
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Conferences Section */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Start</CardTitle>
            <CardDescription className="text-gray-400">
              Create or join a conference to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => createConference(true)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                size="lg"
                disabled={!client || !user}
              >
                <Plus className="h-5 w-5 mr-2" />
                Start Instant Conference
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowJoinModal(true)}
                className="w-full border-slate-600 text-white hover:bg-slate-700"
                disabled={!client || !user}
              >
                <Users className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showInstantModal && (
        <InstantMeeting 
          enable={showInstantModal} 
          setEnable={setShowInstantModal} 
        />
      )}
      {showJoinModal && (
        <JoinMeeting 
          enable={showJoinModal} 
          setEnable={setShowJoinModal} 
        />
      )}
    </div>
  );
}

