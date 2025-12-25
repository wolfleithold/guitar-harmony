import { NextRequest, NextResponse } from "next/server";
import {
  initDb,
  getAllGuitars,
  searchGuitars,
  createGuitar,
  Guitar,
} from "@/lib/db-postgres";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("search");

    let guitars: Guitar[];
    if (query) {
      guitars = await searchGuitars(query);
    } else {
      guitars = await getAllGuitars();
    }

    return NextResponse.json(guitars);
  } catch (error) {
    console.error("Error fetching guitars:", error);
    return NextResponse.json(
      { error: "Failed to fetch guitars" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();
    const guitar: Omit<Guitar, "id" | "created_at"> = {
      name: body.name || "Untitled Guitar",
      type: body.type || "Other",
      notes: body.notes || "",
      image_url: body.image_url || null,
    };

    const id = await createGuitar(guitar);
    return NextResponse.json({ id, ...guitar }, { status: 201 });
  } catch (error) {
    console.error("Error creating guitar:", error);
    return NextResponse.json(
      { error: "Failed to create guitar" },
      { status: 500 }
    );
  }
}
