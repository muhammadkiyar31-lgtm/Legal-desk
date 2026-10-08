import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Logout API error:", error);

    return NextResponse.json(
      { message: "Failed to logout." },
      { status: 500 }
    );
  }
}