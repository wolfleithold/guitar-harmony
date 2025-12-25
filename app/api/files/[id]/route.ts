import { NextRequest, NextResponse } from "next/server";
import { initDb, getFile, deleteFile } from "@/lib/db-postgres";
import { del } from "@vercel/blob";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const fileId = parseInt(id);
    const file = await getFile(fileId);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Redirect to blob URL
    return NextResponse.redirect(file.file_path);
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const fileId = parseInt(id);

    const file = await getFile(fileId);
    if (file) {
      // Delete from Vercel Blob
      await del(file.file_path);
    }

    await deleteFile(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
