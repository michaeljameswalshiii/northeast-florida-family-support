import Link from "next/link";
import {
  ArrowRight,
  Baby,
  BookOpenCheck,
  Building2,
  HeartHandshake,
  LifeBuoy,
  MapPinned,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CoastalIllustration } from "@/components/CoastalIllustration";
import { Navigator } from "@/components/Navigator";

const PATHS = [
  { icon: Baby, kicker: "Birth to age 3", title: "Start with Early Steps", text: "Free developmental screening and family-centered early intervention. You can refer your child directly.", href: "https://pediatrics.med.jax.ufl.edu/patient-care/early-steps-program/", action: "Make a referral" },
  { icon: BookOpenCheck, kicker: "Age 3 and school", title: "Ask for Child Find or ESE", text: "Request a school evaluation for an IEP, related services, or accommodations—separate from a medical diagnosis.", href: "/resources", action: "Find school support" },
  { icon: ShieldCheck, kicker: "Long-term support", title: "Apply through Florida APD", text: "Start developmental-disability eligibility and iBudget waiver pre-enrollment as early as possible.", href: "https://apd.myflorida.com/services/apply.htm", action: "Open APD application" },
];

const HUMAN_HELP = [
  { name: "UF Health Jacksonville CARD", text: "Free autism navigation, training, consultation, and family support across the lifespan.", phone: "904-633-0760", href: "https://pediatrics.med.jax.ufl.edu/patient-care/center-for-autism-and-related-disabilities/", color: "teal" },
  { name: "Northeastern Early Steps", text: "No-cost developmental support for infants and toddlers; no diagnosis needed to begin a referral.", phone: "1-800-218-0001", href: "https://pediatrics.med.jax.ufl.edu/patient-care/early-steps-program/", color: "coral" },
  { name: "Florida APD — Northeast", text: "Eligibility, iBudget pre-enrollment, crisis updates, and developmental-disability services.", phone: "386-238-4607", href: "https://apd.myflorida.com/region/northeast/", color: "blue" },
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero">
        <div className="hero-glow" />
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><MapPinned size={15} /> Built for the First Coast</p>
            <h1>Disability support is complicated. <em>Your next step shouldn’t be.</em></h1>
            <p className="hero-lede">Find trusted autism and developmental-disability resources for children, adults, and families across Northeast Florida.</p>
            <div className="hero-actions">
              <Link className="button primary" href="#ask"><Sparkles size={18} /> Ask My AI Administrator</Link>
              <Link className="button secondary" href="/resources">Browse resources <ArrowRight size={18} /></Link>
            </div>
            <div className="hero-trust">
              <span><ShieldCheck size={17} /> Official sources prioritized</span>
              <span><HeartHandshake size={17} /> Family-centered guidance</span>
            </div>
          </div>
          <CoastalIllustration />
        </div>
        <div className="county-strip">
          <div className="shell">
            <span>Serving</span><p>Baker</p><p>Clay</p><p>Duval</p><p>Flagler</p><p>Nassau</p><p>Putnam</p><p>St. Johns</p>
          </div>
        </div>
      </section>

      <section className="section path-section">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">Choose a starting point</p><h2>Three doors into the system.</h2></div>
            <p>You can use medical, school, and state-service pathways at the same time. Starting one does not require waiting for another.</p>
          </div>
          <div className="path-grid">
            {PATHS.map(({ icon: Icon, kicker, title, text, href, action }, index) => (
              <article className="path-card" key={title}>
                <div className="path-number">0{index + 1}</div><span className="path-icon"><Icon size={25} /></span>
                <p className="eyebrow">{kicker}</p><h3>{title}</h3><p>{text}</p>
                <Link href={href}>{action} <ArrowRight size={17} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section ai-section"><div className="shell"><Navigator /></div></section>

      <section className="section human-section">
        <div className="shell">
          <div className="section-heading centered">
            <p className="eyebrow">Prefer help from a person?</p><h2>Real people. Free starting points.</h2>
            <p>These organizations can help you understand options before you choose a provider.</p>
          </div>
          <div className="human-grid">
            {HUMAN_HELP.map((item) => (
              <article className={`human-card is-${item.color}`} key={item.name}>
                <span className="human-icon"><LifeBuoy size={22} /></span><h3>{item.name}</h3><p>{item.text}</p>
                <div><a href={`tel:${item.phone.replace(/[^\d+]/g, "")}`}><Phone size={16} /> {item.phone}</a><a href={item.href} target="_blank" rel="noreferrer">Website <ArrowRight size={16} /></a></div>
              </article>
            ))}
          </div>
          <div className="all-resources-callout">
            <div><Building2 size={28} /><span><strong>Need a therapy provider or local program?</strong><p>Filter by county, age, and type of support.</p></span></div>
            <Link className="button dark" href="/resources">Open the resource directory <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section answers-section" id="answers">
        <div className="shell answers-grid">
          <div className="answers-intro">
            <p className="eyebrow">Plain-language answers</p><h2>The questions families ask first.</h2>
            <p>Florida’s system uses different names than many other states. These short answers keep you on the right path.</p>
            <Link href="/resources" className="text-link">Find matching organizations <ArrowRight size={17} /></Link>
          </div>
          <div className="faq-list">
            <details open><summary>How do I get autism services in Northeast Florida?</summary><p>Ask your pediatrician for screening and a comprehensive diagnostic evaluation; contact Early Steps before age three or your school district’s Child Find/ESE office at age three and older; call your insurer or Medicaid plan about therapy; and contact CARD for free navigation. Apply separately to APD if long-term developmental-disability support may be needed.</p></details>
            <details><summary>What is ABA therapy?</summary><p>Applied Behavior Analysis is an individualized approach that assesses behavior, teaches useful skills through reinforcement, measures progress, and adjusts the plan using data. Goals may include communication, daily living, learning, play, independence, and safety. Look for positive, respectful, family-centered care.</p></details>
            <details><summary>What replaces a CDDO in Florida?</summary><p>CDDO is Kansas terminology and is not used in Florida. Florida’s Agency for Persons with Disabilities—APD—handles developmental-disability eligibility and the iBudget waiver. CARD offers autism navigation, while Early Steps and school districts handle early-intervention and educational services.</p></details>
            <details><summary>Who qualifies for the iBudget waiver?</summary><p>An applicant must meet APD developmental-disability eligibility, Medicaid financial rules, and the functional level of care used for an intermediate-care facility. The qualifying condition must begin before age 18 and be expected to continue indefinitely. Eligibility does not guarantee immediate enrollment; many people enter pre-enrollment until funding is available.</p></details>
            <details><summary>Is an autism diagnosis enough for an IEP?</summary><p>No. A medical diagnosis and school eligibility are separate. The school determines whether the disability affects educational performance and whether the student needs specialized instruction. A student who does not qualify for an IEP may still qualify for a Section 504 plan.</p></details>
          </div>
        </div>
      </section>

      <section className="emergency-band" aria-label="Emergency information"><div className="shell"><strong>Immediate danger or a medical emergency?</strong><p>Call <a href="tel:911">911</a>. For community and crisis-resource navigation, dial <a href="tel:211">211</a>.</p></div></section>
    </main>
  );
}
