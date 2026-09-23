import { NextResponse } from "next/server";
import { deleteClinicPhoto, getClinicPhoto, photoBytes } from "@/lib/clinic-photos";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { id, photoId } = await context.params;
    const photo = await getClinicPhoto(id, photoId);
    if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    const { buffer, contentType } = photoBytes(photo);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load that photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { id, photoId } = await context.params;
    await deleteClinicPhoto(id, photoId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete that photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
