"use client";

import { useState, useEffect, ReactNode } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser, useAuth } from "@clerk/nextjs";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

export const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // If Stream API key is not configured, just render children without Stream
  if (!apiKey) {
    console.warn("⚠️ NEXT_PUBLIC_STREAM_API_KEY is not set. Video features will be disabled.");
    return <>{children}</>;
  }

  useEffect(() => {
    if (!isLoaded || !user || !apiKey) {
      return;
    }

    /**
     * Token provider function that fetches a Stream token from the API
     * This is called by Stream SDK when it needs a new token
     */
    const tokenProvider = async (): Promise<string> => {
      try {
        // Get the Clerk token for authentication
        const clerkToken = await getToken();

        if (!clerkToken) {
          throw new Error("No authentication token available");
        }

        // Call the API route to get a Stream token
        const response = await fetch("/api/stream/token", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${clerkToken}`,
          },
          credentials: "include", // Include cookies for authentication
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Failed to get token" }));
          throw new Error(error.error || "Failed to generate Stream token");
        }

        const data = await response.json();
        return data.token;
      } catch (error: any) {
        console.error("Error in tokenProvider:", error);
        throw error;
      }
    };

    // Initialize Stream Video client with API key, user info, and token provider
    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: user.id,
        name: user.primaryEmailAddress?.emailAddress || user.fullName || user.username || "User",
        image: user.imageUrl || undefined,
      },
      tokenProvider, // function to get a user token
    });

    setVideoClient(client);

    // Cleanup function to disconnect client when component unmounts
    return () => {
      client.disconnectUser();
    };
  }, [user, isLoaded, getToken]);

  // Show loading state while client is being initialized
  // But don't block rendering - render children even if video client isn't ready
  if (!videoClient) {
    return <>{children}</>;
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};
