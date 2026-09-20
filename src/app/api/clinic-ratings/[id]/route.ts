import { NextRequest, NextResponse } from "next/server";
import { deleteClinicRating, getClinicRating } from "@/lib/clinic-ratings";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const clinic = await getClinicRating(id);
    if (!clinic) return NextResponse.json({ error: "Clinic rating not found." }, { status: 404 });
    return NextResponse.json({ clinic });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load this clinic rating.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteClinicRating(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete this clinic rating.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
