import { NextRequest, NextResponse } from "next/server";
import { clinicRatingsPersistLabel, listClinicRatings, saveClinicRating } from "@/lib/clinic-ratings";

export async function GET() {
  try {
    const clinics = await listClinicRatings();
    return NextResponse.json({ clinics, persistLabel: clinicRatingsPersistLabel() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load clinic ratings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const clinic = await saveClinicRating(body);
    return NextResponse.json({ clinic, persistLabel: clinicRatingsPersistLabel() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save this clinic rating.";
    const status = /clinic name|email/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
