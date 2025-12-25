import { NextRequest, NextResponse } from "next/server";
import { initDb, markSongAsPlayed } from "@/lib/db-postgres";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const songId = parseInt(id);

    if (isNaN(songId)) {
      return NextResponse.json({ error: "Invalid song ID" }, { status: 400 });
    }

    const updatedSong = await markSongAsPlayed(songId);

    return NextResponse.json(updatedSong);
  } catch (error) {
    console.error("Error marking song as played:", error);
    return NextResponse.json(
      { error: "Failed to mark song as played" },
      { status: 500 }
    );
  }
}
