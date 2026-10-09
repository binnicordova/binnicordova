# Claims and wording

The sources of truth, in order: the current `public/Binni_Cordova_Resume.pdf`, what he confirmed
in conversation (memory notes and `scripts/confirmed_terms.txt`), then nothing. When this file and
the PDF's header comment in `resume/resume.html` disagree, the comment and memory win.

## The role boundary (memory: architect-role-boundary)

His process is: he proposes a design, a software architect validates it, they refine it together,
he implements it. So write "Propose and implement ... refining designs with a software architect".

Never: "Architect" as a verb or title, "Mobile/Solutions/Software Architect", "leads architecture
reviews", "Solutions architecture". Allowed: "offline-first architecture" (a pattern), the TECSUP
Certificate in Software Architecture (a credential), lowercase "software architect" naming the
person who validates his designs, "design reviews". The phrase "architecture reviews" only where a
posting keyword gate truly needs it, as "bring designs to architecture reviews".

"Rebuilt", not "Redesigned". The offline-first rebuild ran "while 1,500+ sellers kept using the
app"; never "zero downtime". "Mentor engineers" is in the base PDF but he has not confirmed it, so
keep it low in the list and do not expand it into "lead" or "manage".

## Interest-only terms

For a skill the posting asks for and he lacks:
- One sentence, in the Summary only, next to the real equivalent. Not in Skills, not in a bullet,
  not in Keywords as experience.
- Vary the verb across sentences ("Eager to add", "Wants to grow into", "Ready to apply the same
  workflow with") so it does not read as one repeated line. Three or four sentences at most; if
  you need more, the verdict was SKIP, say so.
- Group related items in one sentence ("Docker, Kubernetes, and Terraform") when they belong
  together.

Always interest-only if the posting asks: Python, Backend-for-Frontend, LangGraph, Codex, Cursor,
React Native New Architecture (JSI, TurboModules, Fabric), Kubernetes, Docker, Turborepo, Detox,
SSL/certificate pinning, Fastlane, Xcode Cloud, GitHub Copilot. Anything else that is not in the
PDF or confirmed (NestJS, Azure, PostgreSQL, PHP, Kafka, Terraform ...) follows the same rule.
`audit.py` fails a build that puts any of them outside the Summary.

## Equivalents that are real

Jenkins, Bitrise, GitHub Actions and EAS for Fastlane. Claude Code and a supervised Claude Agent
SDK multi-agent system for GitHub Copilot or "AI coding tools". Serverless event-driven AWS
microservices for containerized services. AWS API Gateway, SNS/SQS, Cognito, KMS and CloudWatch
for their Azure counterparts. Datadog and CloudWatch for other observability tools.

## Numbers

Every number is already in the PDF. Copy it exactly (1,350,000+ orders, 1,500+ sellers, 100,000+
users, 90%+ coverage, 13 apps, 90 days, 1,000,000+ downloads). A derived figure (for example
"7+ years of React Native", counted from Mar 2019) needs a `#number` line in the keywords file and
a sentence in the report. Do not round up, and do not invent a new metric.

## Own apps and the App Store

None of the 13 apps could be found on the App Store (memory: app-store-presence-unverified). Say
"13 apps on Google Play". Omit the App Store link and any claim of releasing his own apps to the
App Store until he supplies a developer URL. Releases at employers (TestFlight, App Store Connect
on the Itau app) are confirmed skills and may be stated.

## Style

- Plain, specific, evidence over adjectives. Avoid: passionate, leverage, spearhead, robust,
  seamless, cutting-edge, results-driven, synergy, "startup mindset", "bias for action".
- Canadian spelling (optimized, enrolment), "Full-Stack" hyphenated, numerals for counts,
  "Certificate" for TECSUP, language levels Basic / Intermediate / Advanced / Native.
- Typography: only plain ASCII punctuation. No em dash, en dash, curly quotes, ellipsis, middle
  dot, non-breaking space. Keep accented letters (Itau must be written Ita&uacute; in HTML,
  Tecnologico as Tecnol&oacute;gico). `audit.py` enforces this on the PDF text layer.
- Harvard layout: two-line entry heading (employer and place, title and dates), italic descriptor
  line under each role, bullets of at most two lines, 10pt Times, 2 pages.
- Education stays. Employers, titles and dates are never edited. Languages: keep Spanish and
  English; keep French when the posting serves French speakers; drop the rest if the posting
  does not use them.

## What to cut when the posting does not ask

Native Swift/Kotlin detail on a pure React Native posting, Jira, JasperReports, SQL, Google Cloud
and Firebase, New Relic, CodePush, on-device AI, WebSockets, Redux/Recoil lists, unrelated
packages, Italian and German. Keep React Native, Expo, TypeScript and AWS prominent whenever the
posting is anywhere near them. Never cut an employer to save space; trim its bullets.
