export const ANCHORS = [
  {
    id: "not_present",
    label: "Not Present",
    meaning: "The practice is absent or happens only by individual staff initiative, not as a system feature.",
    points: 0,
  },
  {
    id: "emerging",
    label: "Emerging",
    meaning: "The practice exists in limited or inconsistent form, dependent on specific staff or locations.",
    points: 1,
  },
  {
    id: "established",
    label: "Established",
    meaning: "The practice is a reliable, expected part of how care is delivered across the program.",
    points: 2,
  },
  {
    id: "exemplary",
    label: "Exemplary",
    meaning: "The practice is fully embedded, proactively improved upon, and shapes how other domains of care operate.",
    points: 3,
  },
] as const;

export type AnchorId = (typeof ANCHORS)[number]["id"];

export const LOCATION_TYPES = [
  { id: "physical", label: "Physical location (in-person)" },
  { id: "mobile", label: "Mobile" },
  { id: "virtual", label: "Virtual (telehealth)" },
] as const;

export type LocationTypeId = (typeof LOCATION_TYPES)[number]["id"];

export const ACCESSIBILITY_FEATURES = [
  { id: "ada_parking", label: "Accessible parking close to the entrance" },
  { id: "ramp_or_level", label: "Ramp or level entrance (no stairs required)" },
  { id: "automatic_doors", label: "Automatic or easy-open doors" },
  { id: "wide_halls", label: "Wide hallways and turning space for wheelchairs" },
  { id: "accessible_restroom", label: "Accessible restroom" },
  { id: "accessible_exam", label: "Accessible exam table, dental chair, or lift" },
  { id: "sensory_room", label: "Sensory-friendly or quiet room" },
  { id: "low_sensory_lighting", label: "Adjustable or low-sensory lighting / sound" },
  { id: "visual_supports", label: "Visual supports, social stories, or picture schedules" },
  { id: "aac_welcome", label: "AAC and other communication supports are welcome" },
  { id: "asl_interpreter", label: "ASL interpreter available" },
  { id: "wait_accommodations", label: "Wait-time accommodations (wait in car, short wait, first-roomed)" },
  { id: "other", label: "Other (describe in notes)" },
] as const;

export type AccessibilityFeatureId = (typeof ACCESSIBILITY_FEATURES)[number]["id"];

export const CLINIC_PHOTO_KINDS = [
  { id: "facility", label: "Facility" },
  { id: "accessibility", label: "Accessibility feature" },
] as const;

export type ClinicPhotoKind = (typeof CLINIC_PHOTO_KINDS)[number]["id"];

export const SERVICE_LINES = [
  { id: "medical", label: "Medical" },
  { id: "dental", label: "Dental" },
  { id: "vision", label: "Vision" },
] as const;

export type ServiceLineId = (typeof SERVICE_LINES)[number]["id"];

export const DOMAINS = [
  {
    id: "coordinated_teams",
    number: 1,
    title: "Coordinated Teams",
    anchors: {
      not_present: "Medical, dental, and vision providers operate independently with no shared planning or awareness of one another’s involvement.",
      emerging: "Providers occasionally consult one another, usually only when a problem arises or a family/caregiver initiates contact.",
      established: "Providers routinely communicate, co-locate, or hold joint case conferences for patients with complex needs.",
      exemplary: "Providers function as a true interdisciplinary team, with shared treatment planning built into standard workflow across medical, dental, and vision care.",
    },
  },
  {
    id: "coordinated_scheduling",
    number: 2,
    title: "Coordinated Scheduling",
    anchors: {
      not_present: "Appointments must be scheduled separately with no effort to align visit dates.",
      emerging: "Same-day scheduling is possible on request but not offered proactively.",
      established: "Clinics routinely offer or default to combined-visit scheduling across medical, dental, and vision care.",
      exemplary: "Scheduling is actively optimized around the patient (e.g., minimizing wait time, sequencing providers to reduce sensory fatigue, anticipating needs based on care plan).",
    },
  },
  {
    id: "specialized_accommodations",
    number: 3,
    title: "Specialized Accommodations",
    anchors: {
      not_present: "Standard visit lengths, equipment, and environments are used regardless of patient need.",
      emerging: "Accommodations are available but must be specifically requested and are inconsistently honored.",
      established: "Accommodations (extended time, sensory-friendly space, accessible equipment, desensitization visits) are a standard offering built into intake and scheduling.",
      exemplary: "Accommodations are individualized and proactively planned in advance of each visit, based on a documented sensory/behavioral profile.",
    },
  },
  {
    id: "shared_communication",
    number: 4,
    title: "Shared Communication",
    anchors: {
      not_present: "Records are siloed; providers have no access to notes or histories from other domains of care.",
      emerging: "Records can be requested or transferred manually but are not routinely reviewed across domains.",
      established: "A shared or interoperable record system allows providers to review relevant history across medical, dental, and vision care.",
      exemplary: "Providers actively cross-reference shared records to flag interactions (e.g., medication effects on teeth or eyes) and incorporate non-verbal/behavioral communication tools into the shared record.",
    },
  },
  {
    id: "minimally_invasive",
    number: 5,
    title: "Minimally Invasive Approaches",
    anchors: {
      not_present: "Surgical, drilling, or general-anesthesia approaches are used as a first-line response without exploring alternatives.",
      emerging: "Minimally invasive options (e.g., silver diamine fluoride, remineralization) are used occasionally, at individual provider discretion.",
      established: "Minimally invasive and preventive approaches are the standard first-line practice, with more invasive options reserved for cases where clearly necessary.",
      exemplary: "The care team actively tracks outcomes and continuously adjusts practice to minimize invasive interventions, while maintaining full transparency with the patient/family.",
    },
  },
  {
    id: "vision_integration",
    number: 6,
    title: "Vision Care Integration",
    anchors: {
      not_present: "Vision screening or care is not integrated with medical/dental services and is not addressed unless separately sought out.",
      emerging: "Vision care is available but referred out with little coordination or follow-up tracking.",
      established: "Vision screening is a routine part of the overall care plan, with results shared across the medical/dental team.",
      exemplary: "Vision care is fully integrated into joint scheduling, shared records, and accommodation planning on par with medical and dental domains.",
    },
  },
  {
    id: "consent_self_determination",
    number: 7,
    title: "Consent, Communication, and Self-Determination",
    anchors: {
      not_present: "Consent and treatment decisions are handled entirely through caregivers/guardians with no adapted communication to the individual.",
      emerging: "Some attempt is made to explain procedures to the individual, but methods are not tailored to communication needs.",
      established: "Providers routinely use accessible consent processes (plain language, visual supports, AAC) matched to the individual’s communication style.",
      exemplary: "Supported decision-making is built into every visit, with the individual’s preferences and understanding actively documented and revisited over time.",
    },
  },
  {
    id: "lifespan_continuity",
    number: 8,
    title: "Continuity Across the Lifespan",
    anchors: {
      not_present: "No process exists to transfer coordinated care history when a patient transitions providers or care settings.",
      emerging: "Transition happens but relies on informal handoffs or caregiver memory rather than documented history.",
      established: "A formal transition process transfers integrated medical/dental/vision history and accommodation needs to new providers.",
      exemplary: "Transitions are planned in advance with overlap between outgoing and incoming teams, ensuring no gap in coordinated, accommodated care.",
    },
  },
  {
    id: "payment_flexibility",
    number: 9,
    title: "Payment Flexibility and Insurance Access",
    anchors: {
      not_present: "Payment options are rigid: only a narrow set of insurance types is accepted, there is no self-pay option, and patients whose coverage doesn’t fit are turned away or referred out.",
      emerging: "Some flexibility exists (e.g., self-pay or certain Medicaid plans accepted), but acceptance varies by provider or location and depends on staff discretion or on the family working out coverage on their own.",
      established: "The clinic reliably accepts self-pay and a broad range of insurance, including Medicaid (fee-for-service and managed care) and Medicare, with coverage verified at intake and payment options clearly communicated.",
      exemplary: "Payment access is built around the IDD population: self-pay, sliding-scale, insurance, Medicaid, and waiver-funded options are all accepted, and staff proactively help families resolve coverage gaps and authorizations so payer rules never limit needed accommodations or extended visits.",
    },
  },
] as const;

export type DomainId = (typeof DOMAINS)[number]["id"];

export const PAYMENT_GROUPS = [
  {
    id: "self_pay",
    title: "Self-Pay",
    items: [
      { id: "self_pay", label: "Self-pay (uninsured or out-of-network patients)" },
      { id: "sliding_scale", label: "Sliding-scale or income-based fee" },
      { id: "payment_plans", label: "Payment plans / installment arrangements" },
    ],
  },
  {
    id: "private_federal",
    title: "Private and Federal Insurance",
    items: [
      { id: "commercial", label: "Commercial / private insurance" },
      { id: "medicare", label: "Medicare" },
      { id: "dual_eligible", label: "Dual-eligible (Medicare + Medicaid)" },
    ],
  },
  {
    id: "medicaid",
    title: "Medicaid",
    items: [
      { id: "medicaid_ffs", label: "Medicaid fee-for-service" },
      { id: "medicaid_mco", label: "Medicaid managed care (MCO) plans" },
      { id: "chip", label: "CHIP / children’s Medicaid" },
      { id: "hcbs_waiver", label: "Medicaid HCBS / IDD waiver-funded services" },
      { id: "other_state", label: "Other state or county programs (specify in Notes)" },
    ],
  },
] as const;

export type PaymentTypeId = (typeof PAYMENT_GROUPS)[number]["items"][number]["id"];

export const COVERAGE_GAP_OPTIONS = [
  { id: "refers_out", label: "Refers the patient elsewhere with little follow-up" },
  { id: "offers_self_pay", label: "Offers self-pay, sliding-scale, or a payment plan" },
  { id: "helps_enrollment", label: "Helps the patient or family with enrollment, eligibility, or appeals" },
  { id: "coordinates_case_manager", label: "Coordinates with a case manager, care coordinator, or waiver support coordinator" },
  { id: "other", label: "Other (describe in notes)" },
] as const;

export type CoverageGapId = (typeof COVERAGE_GAP_OPTIONS)[number]["id"];

export const MAX_DOMAIN_POINTS = ANCHORS[ANCHORS.length - 1].points;
export const MAX_TOTAL_POINTS = DOMAINS.length * MAX_DOMAIN_POINTS;
