"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useGetCallById } from "@/app/hooks/useGetCallById";
import { useAuth as useAppAuth } from "@/contexts/auth-context";
import JoinPreview from "./components/JoinPreview";
import HostView from "./components/HostView";
import ParticipantView from "./components/ParticipantView";

export default function ConferencePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { user: authUser, isLoading: authLoading } = useAppAuth();
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isHost, setIsHost] = useState(false);

  // Fetch the call details using our custom hook
  const { call, isCallLoading } = useGetCallById(id);

  // Check conference details and determine if user is host
  const [conferenceDetails, setConferenceDetails] = useState<{ hasPassword: boolean; createdBy?: string } | null>(null);
  const [loadingConference, setLoadingConference] = useState(false);

  // Function to check and set host status
  const checkHostStatus = async () => {
    if (!call || !id || !authUser) {
      console.log('🚫 Cannot check host status - missing requirements:', {
        hasCall: !!call,
        hasId: !!id,
        hasAuthUser: !!authUser
      });
      return;
    }
    
    setLoadingConference(true);
    console.log('🔍 Starting host status check...');
    
    // First, check sessionStorage to see if user created this conference
    let isUserHostFromStorage = false;
    if (typeof window !== 'undefined') {
      try {
        const creatorInfoKey = `conference_creator_${id}`;
        const creatorInfoStr = sessionStorage.getItem(creatorInfoKey);
        if (creatorInfoStr) {
          const creatorInfo = JSON.parse(creatorInfoStr);
          console.log('📦 Found conference creator info in sessionStorage:', creatorInfo);
          
          // Check if the current user created this conference
          if (creatorInfo.createdBy === authUser.clerkUserId) {
            isUserHostFromStorage = true;
            console.log('👑 USER IS THE HOST (from sessionStorage) - User created this conference');
            
            // Clean up old entries (older than 1 hour)
            const createdAt = new Date(creatorInfo.createdAt);
            const now = new Date();
            const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursDiff > 1) {
              sessionStorage.removeItem(creatorInfoKey);
              console.log('🧹 Cleaned up old sessionStorage entry');
            }
          } else {
            console.log('👤 User did not create this conference (sessionStorage check)');
          }
        } else {
          console.log('📭 No conference creator info in sessionStorage');
        }
      } catch (error) {
        console.error('Error reading sessionStorage:', error);
      }
    }
    
    // If we found the user is host from sessionStorage, set it immediately but still verify with backend
    if (isUserHostFromStorage) {
      setIsHost(true);
      console.log('✅ Set isHost=true from sessionStorage (will verify with backend)');
    }
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/conferences/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setConferenceDetails(data.data.conference);
        
        // Check if user is the creator (host)
        // Compare with user.clerkUserId from auth context (Clerk user ID)
        const isUserHostFromBackend = data.data.conference.createdBy === authUser.clerkUserId;
        
        console.log('✅ Host Check Result (Backend):', {
          conferenceCreatedBy: data.data.conference.createdBy,
          clerkUserId: authUser.clerkUserId,
          isHost: isUserHostFromBackend,
          match: data.data.conference.createdBy === authUser.clerkUserId,
          fromSessionStorage: isUserHostFromStorage
        });
        
        // Prioritize sessionStorage over backend - if user created conference, trust that
        if (isUserHostFromStorage) {
          console.log('👑 USER IS THE HOST (sessionStorage confirmed) - Showing HostView');
          setIsHost(true);
        } else if (isUserHostFromBackend) {
          console.log('👑 USER IS THE HOST (backend verified) - Showing HostView');
          setIsHost(true);
        } else {
          console.log('👤 USER IS A PARTICIPANT (backend verified) - Showing ParticipantView');
          setIsHost(false);
        }
      } else {
        // Fallback: if backend fails but sessionStorage says host, trust sessionStorage
        if (isUserHostFromStorage) {
          console.log('⚠️ Backend API failed, but sessionStorage confirms user is host');
          console.log('👑 USER IS THE HOST (sessionStorage fallback) - Showing HostView');
          setIsHost(true);
        } else {
          // Fallback: check if user is first participant or check Stream custom data
          const isFirstParticipant = call.state.createdBy?.id === authUser.clerkUserId;
          console.log('⚠️ Conference API failed, using fallback check:', {
            streamCallCreatedBy: call.state.createdBy?.id,
            clerkUserId: authUser.clerkUserId,
            isFirstParticipant,
            isHost: isFirstParticipant
          });
          
          if (isFirstParticipant) {
            console.log('👑 USER IS THE HOST (fallback) - Showing HostView');
          } else {
            console.log('👤 USER IS A PARTICIPANT (fallback) - Showing ParticipantView');
          }
          
          setIsHost(isFirstParticipant);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching conference details:", error);
      
      // If sessionStorage says host, trust it on error
      if (isUserHostFromStorage) {
        console.log('⚠️ Backend error, but sessionStorage confirms user is host');
        console.log('👑 USER IS THE HOST (sessionStorage error fallback) - Showing HostView');
        setIsHost(true);
      } else {
        // Fallback: check Stream call creator
        const isHostFallback = call?.state?.createdBy?.id === authUser?.clerkUserId;
        
        console.log('⚠️ Using error fallback check:', {
          streamCallCreatedBy: call?.state?.createdBy?.id,
          clerkUserId: authUser?.clerkUserId,
          isHost: isHostFallback
        });
        
        if (isHostFallback) {
          console.log('👑 USER IS THE HOST (error fallback) - Showing HostView');
        } else {
          console.log('👤 USER IS A PARTICIPANT (error fallback) - Showing ParticipantView');
        }
        
        setIsHost(isHostFallback);
      }
    } finally {
      setLoadingConference(false);
      console.log('🏁 Host status check completed. Final isHost:', isHost);
    }
  };

  // Check host status before joining
  useEffect(() => {
    if (call && id && !confirmJoin && authUser) {
      checkHostStatus();
    }
  }, [call, id, confirmJoin, authUser]);

  // Re-check host status after joining
  useEffect(() => {
    if (confirmJoin && call && id && authUser) {
      // Small delay to ensure conference data is available
      setTimeout(() => {
        checkHostStatus();
      }, 500);
    }
  }, [confirmJoin, call, id, authUser]);

  // Toggle camera/mic for preview
  const togglePreviewCamera = () => {
    setCamEnabled(!camEnabled);
  };

  const togglePreviewMic = () => {
    setMicEnabled(!micEnabled);
  };

  // Side effect: toggle camera/mic based on states after joining
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

  // Leave call function
  const handleLeaveCall = async () => {
    if (confirm("Leave the call?")) {
      try {
        if (call) {
          await call.leave();
          
          // Delete conference from backend if user is the host
          if (isHost) {
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                await fetch(`${backendUrl}/api/conferences/${id}`, {
                  method: 'DELETE',
                });
            } catch (error) {
              console.error("Error deleting conference:", error);
            }
          }
        }
        window.location.href = "/";
      } catch (error) {
        console.error("Error leaving call:", error);
      }
    }
  };

  // Handle PIN verification
  const handlePinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!pinInput || pinInput.length !== 4) {
      setPinError("Please enter a valid 4-digit PIN");
      return;
    }
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/conferences/${id}/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (response.ok) {
        setPinError("");
        setShowPinModal(false);
        setPinInput("");
        await handleJoin();
      } else {
        const error = await response.json();
        setPinError(error.message || "Incorrect PIN. Please try again.");
      }
    } catch (error: any) {
      console.error("Error verifying PIN:", error);
      setPinError("Failed to verify PIN. Please try again.");
    }
  };

  // Handle the user confirming they want to join
  const handleJoin = async () => {
    if (!call || !authUser) {
      alert("Please wait for the call to load and ensure you're signed in.");
      return;
    }
    
    // Wait for conference details to load if still loading
    if (loadingConference) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check if PIN is required
    const requiresPin = conferenceDetails?.hasPassword === true || 
                       (conferenceDetails === null && call?.state?.custom?.conferenceType === "private");
    
    // If requires password and PIN not verified yet, show PIN modal
    if (requiresPin && !confirmJoin && !showPinModal) {
      setShowPinModal(true);
      return;
    }
    
    try {
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

  // Wait for user to be loaded (both Clerk and auth context)
  if (!userLoaded || authLoading) {
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
            onClick={() => window.location.href = "/"} 
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  // If user hasn't confirmed joining yet, show join preview
  if (!confirmJoin) {
    return (
      <JoinPreview
        camEnabled={camEnabled}
        micEnabled={micEnabled}
        onToggleCamera={togglePreviewCamera}
        onToggleMic={togglePreviewMic}
        onJoin={handleJoin}
        onCancel={() => window.location.href = "/"}
        showPinModal={showPinModal}
        pinInput={pinInput}
        pinError={pinError}
        onPinChange={setPinInput}
        onPinSubmit={handlePinSubmit}
        onClosePinModal={() => {
                        setShowPinModal(false);
                        setPinInput("");
                        setPinError("");
                      }}
      />
    );
  }

  // Debug: Log host status before rendering
  console.log('📊 Rendering view - Host Status:', {
    isHost,
    clerkUserId: authUser?.clerkUserId,
    conferenceCreatedBy: conferenceDetails?.createdBy,
    confirmJoin,
    loadingConference
  });
  
  if (isHost) {
    console.log('👑 RENDERING HOST VIEW');
  } else {
    console.log('👤 RENDERING PARTICIPANT VIEW');
  }

  // If confirmed (user has joined), render the appropriate view
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <StreamCall call={call}>
        <StreamTheme>
          {isHost ? (
            <HostView
              call={call}
              meetingId={id}
              camEnabled={camEnabled}
              micEnabled={micEnabled}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMicrophone}
              onToggleScreenShare={toggleScreenShare}
              onLeave={handleLeaveCall}
            />
          ) : (
            <ParticipantView
              call={call}
              camEnabled={camEnabled}
              micEnabled={micEnabled}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMicrophone}
              onToggleScreenShare={toggleScreenShare}
              onLeave={handleLeaveCall}
            />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
}
