import { NextRequest, NextResponse } from "next/server";
import { initDb, createFile, getFilesBySongId } from "@/lib/db-postgres";
import { put } from "@vercel/blob";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const songId = parseInt(id);
    const files = await getFilesBySongId(songId);
    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const songId = parseInt(id);
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/zip",
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
      "audio/x-wav",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.endsWith(".zip") &&
      !file.name.endsWith(".mp3") &&
      !file.name.endsWith(".wav")
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only .zip, .mp3, and .wav files are allowed.",
        },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    });

    // Determine file type
    let fileType = "audio";
    if (file.name.endsWith(".zip")) {
      fileType = "logic";
    }

    // Add file record to database
    const fileId = await createFile({
      song_id: songId,
      filename: blob.pathname,
      original_name: file.name,
      file_type: fileType,
      file_path: blob.url,
      file_size: file.size,
    });

    return NextResponse.json(
      {
        id: fileId,
        filename: blob.pathname,
        original_name: file.name,
        file_type: fileType,
        file_size: file.size,
        url: blob.url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
