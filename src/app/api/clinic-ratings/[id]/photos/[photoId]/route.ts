import { NextRequest, NextResponse } from "next/server";
import { deleteClinicPhoto, getClinicPhoto, photoBytes } from "@/lib/clinic-photos";
import { requestHasStaffSession } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; photoId: string }> }) {
  if (!(await requestHasStaffSession(request))) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
  try {
    const { id, photoId } = await context.params;
    const photo = await getClinicPhoto(id, photoId);
    if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    const { buffer, contentType } = photoBytes(photo);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load that photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; photoId: string }> }) {
  if (!(await requestHasStaffSession(request))) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
  try {
    const { id, photoId } = await context.params;
    await deleteClinicPhoto(id, photoId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete that photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
