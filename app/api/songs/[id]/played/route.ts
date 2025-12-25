import { NextRequest, NextResponse } from "next/server";
import { markSongAsPlayed, getSong } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songId = parseInt(id);

    if (isNaN(songId)) {
      return NextResponse.json({ error: "Invalid song ID" }, { status: 400 });
    }

    markSongAsPlayed(songId);
    const updatedSong = getSong(songId);

    return NextResponse.json(updatedSong);
  } catch (error) {
    console.error("Error marking song as played:", error);
    return NextResponse.json(
      { error: "Failed to mark song as played" },
      { status: 500 }
    );
  }
}
