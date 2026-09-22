import type { AccessibilityFeatureId, AnchorId, ClinicPhotoKind, CoverageGapId, DomainId, LocationTypeId, PaymentTypeId, ServiceLineId } from "@/data/idd-care-scale";

export type DomainScores = Partial<Record<DomainId, AnchorId>>;
export type PaymentMatrix = Partial<Record<PaymentTypeId, Partial<Record<ServiceLineId, boolean>>>>;
export type PaymentNotes = Partial<Record<PaymentTypeId, string>>;

export type ClinicCallLog = {
  id: string;
  date: string;
  raterName: string;
  clinicContact: string;
  clinicPhone: string;
  clinicEmail: string;
  notes: string;
  savedAt: string;
};

export type ClinicPhoto = {
  id: string;
  kind: ClinicPhotoKind;
  caption: string;
  contentType: string;
  createdAt: string;
};

export type ClinicRating = {
  id: string;
  clinicName: string;
  street: string;
  suite: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  address: string;
  email: string;
  locationTypes: LocationTypeId[];
  accessibilityFeatures: AccessibilityFeatureId[];
  accessibilityNotes: string;
  photos: ClinicPhoto[];
  scores: DomainScores;
  payment: PaymentMatrix;
  paymentNotes: PaymentNotes;
  coverageGaps: CoverageGapId[];
  coverageGapOther: string;
  callLog: ClinicCallLog[];
  createdAt: string;
  updatedAt: string;
};

export const CLINIC_COUNTIES = ["Baker", "Clay", "Duval", "Flagler", "Nassau", "Putnam", "St. Johns", "Outside Northeast Florida"] as const;

export function formatClinicAddress(clinic: Partial<Pick<ClinicRating, "street" | "suite" | "city" | "state" | "zip" | "county" | "address">>) {
  const line1 = [clinic.street, clinic.suite].filter(Boolean).join(", ");
  const cityLine = [clinic.city, [clinic.state, clinic.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const county = clinic.county && clinic.county !== "Outside Northeast Florida" ? `${clinic.county} County` : clinic.county;
  return [line1, cityLine, county].filter(Boolean).join(" · ") || clinic.address || "";
}

export type ClinicRatingInput = Omit<ClinicRating, "createdAt" | "updatedAt" | "callLog"> & {
  callLog?: ClinicCallLog[];
  call?: Omit<ClinicCallLog, "id" | "savedAt">;
};
