import { fetchQuery } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { api } from "@/enjin/_generated/api";
import { Id } from "@/enjin/_generated/dataModel";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // Get the file from Convex storage
    const fileUrl = await fetchQuery(api.files.getFileUrl, {
      fileId: fileId as Id<"_storage"> // Convex file ID
    });

    if (!fileUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Redirect to the Convex file URL
    return NextResponse.redirect(fileUrl);
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
