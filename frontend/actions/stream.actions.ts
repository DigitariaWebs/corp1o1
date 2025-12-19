"use server";

import { auth } from "@clerk/nextjs/server";
import { StreamClient } from "@stream-io/node-sdk";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY!;

/**
 * Generate a Stream video token for the authenticated user
 * This is a server action that can be called from the client
 */
export async function tokenProvider(): Promise<string> {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      throw new Error("Stream API credentials not configured");
    }

    // Initialize Stream server client
    const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

    // Create a token for the user
    // Token expires in 1 hour (3600 seconds)
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const token = streamClient.createToken(userId, expirationTime);

    return token;
  } catch (error: any) {
    console.error("Error generating Stream token:", error);
    throw error;
  }
}

