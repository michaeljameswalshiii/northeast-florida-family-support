# Northeast Florida Support Navigator

A Vercel-ready Next.js resource navigator for families seeking autism and developmental-disability support across Baker, Clay, Duval, Flagler, Nassau, Putnam, and St. Johns counties.

Live site: https://northeast-florida-family-support.vercel.app

## What is included

- A guided home page with Florida-specific service pathways
- An automated Support Guide, using the cost-aware Amazon Bedrock model ladder adapted from MiBarn
- A curated, filterable resource directory
- An electronic IDD integrated care rating scale for specialty-clinic outreach, with facility photos and accessibility details
- Resource verification dates and an outdated-information reporting form
- A public beta tech-support form with optional screenshots, saved admin notes, and email to the project inbox
- Privacy, accessibility, and terms pages
- Plain-language answers about autism services, ABA, APD, CDDO terminology, school services, and the iBudget waiver
- Responsive and reduced-motion-friendly presentation
- A deterministic local-answer fallback when AI credentials or budget are unavailable

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The site remains fully usable without AWS credentials. Add the variables from `.env.example` to enable AI answers.

## Deployment

GitHub: https://github.com/michaeljameswalshiii/northeast-florida-family-support

Production: https://northeast-florida-family-support.vercel.app

Deploy through Vercel (`npx vercel --prod`) and configure the environment variables in `.env.example`. `AI_USAGE_TENANT_ID` must remain unique so this site has an independent monthly budget record. Auto-deploy from GitHub requires the Vercel GitHub app: https://github.com/apps/vercel

Set `STAFF_ACCESS_PASSWORD` to a strong unique staff password and
`STAFF_SESSION_SECRET` to a random value of at least 32 characters. The staff
feedback inbox stays locked when either value is missing. Clinic ratings are
public.

Tech support notes are stored alongside the other site records in DynamoDB and
emailed to `FEEDBACK_TO_EMAIL` (default `michaeljameswalshiii@gmail.com`). If
`RESEND_API_KEY` is not present, FormSubmit is used and the recipient must
approve its first confirmation email. Review saved notes at `/admin`.

## Content note

Resource information is a starting point, not an endorsement. Families should confirm availability, eligibility, insurance, fees, and service areas directly with each organization. Content was reviewed in September 2026.
