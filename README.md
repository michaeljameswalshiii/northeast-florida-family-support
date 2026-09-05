# Northeast Florida Support Navigator

A Vercel-ready Next.js resource navigator for families seeking autism and developmental-disability support across Baker, Clay, Duval, Flagler, Nassau, Putnam, and St. Johns counties.

## What is included

- A guided home page with Florida-specific service pathways
- My AI Administrator, using the cost-aware Amazon Bedrock model ladder adapted from MiBarn
- A curated, filterable resource directory
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

Deploy through Vercel and configure the environment variables in `.env.example`. `AI_USAGE_TENANT_ID` must remain unique so this site has an independent monthly budget record.

## Content note

Resource information is a starting point, not an endorsement. Families should confirm availability, eligibility, insurance, fees, and service areas directly with each organization. Content was reviewed in September 2026.
