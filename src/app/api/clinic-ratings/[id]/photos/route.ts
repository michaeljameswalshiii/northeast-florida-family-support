import { NextResponse } from "next/server";
import { clinicPhotoUrl, listClinicPhotos, saveClinicPhoto } from "@/lib/clinic-photos";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const photos = await listClinicPhotos(id);
    return NextResponse.json({
      photos: photos.map((photo) => ({ ...photo, url: clinicPhotoUrl(id, photo.id) })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load clinic photos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const photo = await saveClinicPhoto({
      clinicId: id,
      kind: body.kind,
      caption: body.caption,
      contentType: body.contentType,
      data: body.data,
    });
    return NextResponse.json({ photo: { ...photo, url: clinicPhotoUrl(id, photo.id) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save that photo.";
    const status = /under 280|photo file|empty|read|up to/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
