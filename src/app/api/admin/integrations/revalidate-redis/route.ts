import { NextResponse } from "next/server";
import { revalidateRedisClient } from "@/lib/redis";

/**
 * Server-side route handler to immediately reload Upstash Redis client
 * when credentials are updated or toggled in the Admin Panel.
 */
export async function POST() {
  try {
    const isConnected = await revalidateRedisClient();
    return NextResponse.json({
      success: true,
      message: "Server Redis client revalidated successfully.",
      connected: isConnected,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to revalidate Redis client." },
      { status: 500 }
    );
  }
}
