import type { AnchorId, CoverageGapId, DomainId, LocationTypeId, PaymentTypeId, ServiceLineId } from "@/data/idd-care-scale";

export type DomainScores = Partial<Record<DomainId, AnchorId>>;
export type PaymentMatrix = Partial<Record<PaymentTypeId, Partial<Record<ServiceLineId, boolean>>>>;
export type PaymentNotes = Partial<Record<PaymentTypeId, string>>;

export type ClinicCallLog = {
  id: string;
  date: string;
  raterName: string;
  clinicContact: string;
  clinicPhone: string;
  notes: string;
  savedAt: string;
};

export type ClinicRating = {
  id: string;
  clinicName: string;
  address: string;
  locationTypes: LocationTypeId[];
  scores: DomainScores;
  payment: PaymentMatrix;
  paymentNotes: PaymentNotes;
  coverageGaps: CoverageGapId[];
  coverageGapOther: string;
  callLog: ClinicCallLog[];
  createdAt: string;
  updatedAt: string;
};

export type ClinicRatingInput = Omit<ClinicRating, "createdAt" | "updatedAt" | "callLog"> & {
  callLog?: ClinicCallLog[];
  call?: Omit<ClinicCallLog, "id" | "savedAt">;
};
