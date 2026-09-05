import { NextRequest, NextResponse } from "next/server";
import { resourceContext } from "@/data/resources";
import { reserveRequest, settleRequest } from "@/lib/ai-budget";
import { askWithModelLadder, bedrockConfigured } from "@/lib/bedrock";

export const maxDuration = 90;

const CORE_GUIDANCE = `
Northeast Florida uses Florida systems, not Kansas systems.
- CDDO is Kansas terminology. In Florida, APD determines developmental-disability eligibility and manages iBudget waiver access. CARD is a separate free autism navigation and family-support program.
- Birth through 36 months: refer to Northeastern Early Steps; no diagnosis is required to start.
- Age 3 and older: contact the school district's Child Find/ESE office. A medical diagnosis does not automatically establish IEP eligibility.
- Florida Medicaid behavior analysis for eligible recipients under 21 generally requires a written order, comprehensive diagnostic evaluation, a provider, and prior authorization.
- iBudget eligibility requires APD eligibility, qualifying functional limitations/level of care, and Medicaid eligibility. Eligibility does not guarantee immediate enrollment.
`;

function localAnswer(question: string, county?: string, age?: string) {
  const q = question.toLowerCase();
  const local = county ? ` in ${county} County` : " in Northeast Florida";
  const ageNote = age ? ` Because you entered age ${age},` : "";
  if (q.includes("cddo")) return "A CDDO is a Kansas access organization; Florida does not use CDDOs. In Northeast Florida, contact the Agency for Persons with Disabilities (APD) for developmental-disability eligibility and iBudget waiver access at 386-238-4607. For autism-specific navigation and family support, contact UF Health Jacksonville CARD at 904-633-0760.";
  if (q.includes("aba") || q.includes("behavior analysis")) return "ABA—Applied Behavior Analysis—is an individualized approach that assesses behavior, teaches useful skills through reinforcement, and measures progress with data. Goals can include communication, daily living, play, independence, and safety. Ask providers how they use positive methods, include family priorities, respect the person’s communication and distress signals, and coordinate with other therapies. For Medicaid coverage questions, call 1-877-254-1055.";
  if (q.includes("waiver") || q.includes("ibudget") || q.includes("apd")) return "Florida’s developmental-disability HCBS waiver is called iBudget. Start by applying to APD. Applicants must meet Florida developmental-disability eligibility, Medicaid rules, and an institutional level-of-care standard while choosing community services. Enrollment may not be immediate. Call the APD Northeast Region at 386-238-4607 and report any major change in health, safety, housing, or caregiver availability.";
  if (q.includes("autism") || q.includes("evaluation") || q.includes("diagnos")) return `${ageNote} a useful path${local} is to contact your pediatric or primary-care clinician for screening and a comprehensive evaluation, use Early Steps before age three or Child Find/ESE at age three and older, and call your insurance or Medicaid plan about therapy. UF Health Jacksonville CARD offers free navigation at 904-633-0760. These pathways can run at the same time.`;
  return `A strong first step${local} is UF Health Jacksonville CARD at 904-633-0760 for free autism and disability navigation. For a child under three, contact Northeastern Early Steps at 1-800-218-0001. For long-term developmental-disability supports, contact APD Northeast at 386-238-4607. You can also open the resource directory and filter by county, age, and service.`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const question = String(body.question || "").trim();
  const county = String(body.county || "").slice(0, 30);
  const age = String(body.age || "").slice(0, 3);
  if (!question || question.length > 1200) return NextResponse.json({ error: "Enter a question of 1,200 characters or fewer." }, { status: 400 });

  if (!bedrockConfigured()) return NextResponse.json({ answer: localAnswer(question, county, age), model: "Local guide" });

  let reservation = 0;
  try {
    reservation = await reserveRequest();
  } catch {
    return NextResponse.json({ answer: localAnswer(question, county, age), model: "Local guide" });
  }

  const system = `You are My AI Administrator, the calm, precise resource navigator for Northeast Florida families seeking autism and developmental-disability services.
Give a concise, plain-language answer with 3-6 practical next steps. Prioritize official agencies and free navigation. Clearly distinguish medical, school, insurance/Medicaid, and APD pathways. Never diagnose, determine eligibility, promise coverage, or invent a provider. Use only the directory below for names, links, and phone numbers. If safety is urgent, say to call 911; for crisis or social-service navigation mention 211. Do not ask for or repeat sensitive personal information. Do not use markdown tables. End with a brief reminder to verify current availability and eligibility directly.
${CORE_GUIDANCE}
VERIFIED DIRECTORY:\n${JSON.stringify(resourceContext())}`;
  const history = Array.isArray(body.history) ? body.history.slice(-6).map((item: { role?: string; content?: string }) => `${item.role === "assistant" ? "Assistant" : "User"}: ${String(item.content || "").slice(0, 800)}`).join("\n") : "";
  const user = `County: ${county || "not provided"}\nAge: ${age || "not provided"}\nRecent conversation:\n${history || "none"}\nCurrent question: ${question}`;

  try {
    const result = await askWithModelLadder(system, user);
    await settleRequest(reservation, result).catch(() => undefined);
    return NextResponse.json({ answer: result.content, model: result.modelLabel });
  } catch {
    await settleRequest(reservation).catch(() => undefined);
    return NextResponse.json({ answer: localAnswer(question, county, age), model: "Local guide" });
  }
}
