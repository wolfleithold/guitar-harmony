import { NextRequest, NextResponse } from "next/server";
import {
  initDb,
  getGuitar,
  updateGuitar,
  deleteGuitar,
  Guitar,
} from "@/lib/db-postgres";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const guitarId = parseInt(id);
    const guitar = await getGuitar(guitarId);

    if (!guitar) {
      return NextResponse.json({ error: "Guitar not found" }, { status: 404 });
    }

    return NextResponse.json(guitar);
  } catch (error) {
    console.error("Error fetching guitar:", error);
    return NextResponse.json(
      { error: "Failed to fetch guitar" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const guitarId = parseInt(id);
    const body = await request.json();

    const guitar: Partial<Omit<Guitar, "id" | "created_at">> = {
      name: body.name,
      type: body.type,
      notes: body.notes,
      image_url: body.image_url,
    };

    await updateGuitar(guitarId, guitar);
    const updatedGuitar = await getGuitar(guitarId);

    return NextResponse.json(updatedGuitar);
  } catch (error) {
    console.error("Error updating guitar:", error);
    return NextResponse.json(
      { error: "Failed to update guitar" },
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
    const guitarId = parseInt(id);
    await deleteGuitar(guitarId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting guitar:", error);
    return NextResponse.json(
      { error: "Failed to delete guitar" },
      { status: 500 }
    );
  }
}
