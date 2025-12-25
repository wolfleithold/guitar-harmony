import { NextRequest, NextResponse } from "next/server";
import {
  initDb,
  getAllSongs,
  searchSongs,
  createSong,
  Song,
  Readiness,
} from "@/lib/db-postgres";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const readiness = searchParams.get("readiness") as Readiness | null;
    const sortBy = searchParams.get("sort") as
      | "updated"
      | "played-recent"
      | "played-oldest"
      | null;
    const excludeArchived = searchParams.get("excludeArchived") === "true";

    let songs: Song[];
    if (query) {
      songs = await searchSongs(query);
    } else {
      songs = await getAllSongs(
        readiness || undefined,
        sortBy || undefined,
        excludeArchived
      );
    }

    return NextResponse.json(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();
    const song: Song = {
      title: body.title || "Untitled",
      lyrics: body.lyrics || "",
      key: body.key || "",
      guitar: body.guitar || "",
      guitar_id: body.guitar_id || null,
      readiness: body.readiness || "Writing",
    };

    const id = await createSong(song);
    return NextResponse.json({ id, ...song }, { status: 201 });
  } catch (error) {
    console.error("Error creating song:", error);
    return NextResponse.json(
      { error: "Failed to create song" },
      { status: 500 }
    );
  }
}
