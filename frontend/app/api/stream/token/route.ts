import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StreamClient } from "@stream-io/node-sdk";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY!;

/**
 * API route to generate Stream video tokens
 * This endpoint is called by the Stream token provider
 * 
 * Note: The Stream API secret should never be exposed to the client.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      console.error("Stream API credentials missing:", {
        hasKey: !!STREAM_API_KEY,
        hasSecret: !!STREAM_API_SECRET,
      });
      return NextResponse.json(
        { error: "Stream API credentials not configured" },
        { status: 500 }
      );
    }

    // Initialize Stream server client
    const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

    // Create a token for the user
    // Token expires in 1 hour (3600 seconds)
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const token = streamClient.createToken(userId, expirationTime);

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("Error generating Stream token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate token" },
      { status: 500 }
    );
  }
}

