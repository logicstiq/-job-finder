# Job platforms worldwide

A working reference for wiring platforms into the tool. Nobody can list every job site on earth —
there are tens of thousands once you count local boards, university portals and single-industry
sites. This covers the ones that actually carry volume, organised so you can decide what to support.

**Before you wire any of these into production, check two things:** whether it still exists under
that name (this market consolidates constantly — Monster India became Foundit, Monster and
CareerBuilder combined operations), and whether it offers an API or feed. Most do not.

Verified as of mid-2026: by global traffic the top three are **Indeed**, **hh.ru** (Russia/CIS) and
**Computrabajo** (Latin America). Indeed is also the largest by number of postings.

---

## Global / multi-country

| Platform | Notes |
|---|---|
| **Indeed** | Largest worldwide by traffic and postings. 60+ country domains (`in.indeed.com`, `uk.indeed.com`, …). Has a publisher/partner API, access-controlled. |
| **LinkedIn** | Professional network with the strongest recruiter side. Job data is partner-gated via Talent Solutions; no open API. |
| **Google Jobs** | Not a board — an aggregator surfaced in search results (`&ibp=htl;jobs`). Routes to the employer's own form. |
| **Glassdoor** | Reviews plus salary data plus a board. Strongest in the US. |
| **Monster** | Long-established generalist; multiple country sites. |
| **CareerBuilder** | Large US candidate database; now operating alongside Monster. |
| **ZipRecruiter** | US-led, expanding; strong distribution model. |
| **Jooble** | Aggregator across 70+ countries. **Has a partner API.** |
| **Careerjet** | Aggregator, 90+ countries. **Has an API.** |
| **Adzuna** | Aggregator across ~20 countries. **Free API tier — the easiest legitimate start.** |
| **JobStreet / Jobsdb** | SEEK-owned, Southeast Asia. |
| **Talent.com** | Aggregator, multi-country. |
| **Neuvoo** | Now part of Talent.com. |

## India

Naukri (largest), Foundit (formerly Monster India), LinkedIn, Indeed India, Shine, TimesJobs,
Glassdoor India, Instahyre (tech), Cutshort (tech), Hirist (tech), IIMJobs (management),
AngelList/Wellfound India (startups), Apna (blue and grey collar, app-first), WorkIndia (blue collar),
Internshala (internships and entry level), Freshersworld (graduates),
Sarkari Naukri portals and the **National Career Service** (`ncs.gov.in`) for government roles.

## United States and Canada

Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, CareerBuilder, Dice (tech), Built In (tech, by
city), Wellfound (startups), Otta, Hired, SimplyHired, Snagajob (hourly), Craigslist jobs (still
significant locally), USAJobs (federal), GovernmentJobs (state and local), Idealist (nonprofit),
HigherEdJobs, Handshake (students and graduates), Job Bank Canada (`jobbank.gc.ca`), Workopolis,
Eluta (Canada).

## United Kingdom and Ireland

Indeed UK, LinkedIn, Reed, Totaljobs, CV-Library, Jobsite, Adzuna, Otta, Guardian Jobs,
CWJobs (tech), Technojobs, NHS Jobs (healthcare), Civil Service Jobs, Jobs.ie, IrishJobs.

## Europe

**Germany / Austria / Switzerland:** StepStone, Xing, Indeed DE, Jobware, Monster DE, jobs.ch,
karriere.at
**France:** Indeed FR, APEC (graduates and managers), Pôle emploi / France Travail, Welcome to the
Jungle, RegionsJob
**Netherlands:** Indeed NL, Nationale Vacaturebank, Jobbird, Magnet.me
**Spain:** InfoJobs, Indeed ES, Tecnoempleo, LinkedIn
**Italy:** InfoJobs IT, Indeed IT, Monster IT, Subito lavoro
**Nordics:** Finn.no (Norway), Jobbsafari, Arbetsförmedlingen and Blocket Jobb (Sweden), Jobindex
(Denmark), Oikotie and Duunitori (Finland)
**Poland / CEE:** Pracuj.pl, OLX Praca, No Fluff Jobs (tech), Profesia (Slovakia), Jobs.cz (Czechia),
Profession.hu (Hungary), eJobs (Romania)
**Russia / CIS:** hh.ru (dominant), SuperJob, Rabota.ru, Work.ua and Robota.ua (Ukraine)
**Turkey:** Kariyer.net, Yenibiris, Secretcv

## Middle East and Gulf

Bayt (regional leader), GulfTalent, Naukrigulf, Indeed AE, LinkedIn, Dubizzle jobs, Laimoon,
Tanqeeb, Wuzzuf and Forasna (Egypt), Akhtaboot (Jordan and Levant), Qureos.

## Asia Pacific

**Singapore / SEA:** MyCareersFuture (government-run, Singapore), JobStreet, Jobsdb, Glints,
Kalibrr (Philippines), JobsDB Thailand, VietnamWorks, TopCV (Vietnam), Jobstore (Malaysia)
**China:** Zhaopin, 51job, Liepin, BOSS Zhipin
**Japan:** Rikunabi, Mynavi, Doda, Bizreach, Indeed JP, GaijinPot (English-speaking roles)
**South Korea:** JobKorea, Saramin, Wanted
**Australia / NZ:** SEEK (dominant), Indeed AU, Jora, CareerOne, Trade Me Jobs (NZ)

## Africa and Latin America

**Africa:** Jobberman (Nigeria), MyJobMag, BrighterMonday (East Africa), Fuzu, PNet and Careers24
(South Africa), Indeed ZA, Jobweb Africa
**Latin America:** Computrabajo (largest across the region), Bumeran, OCC Mundial (Mexico),
Catho and Vagas.com (Brazil), Empleos Clarín (Argentina), Laborum (Chile), Elempleo (Colombia)

## Remote-only and distributed work

We Work Remotely, Remote OK, FlexJobs (paid), Working Nomads, JustRemote, Remotive, Remote.co,
Himalayas, Dynamite Jobs, Jobspresso, EU Remote Jobs, Turing and Toptal (vetted, contract-style).

## Applicant tracking systems — where jobs appear first

Not job boards, but the highest-value target for a search tool. Companies post here **before** the
boards, and many never syndicate at all. Every one of these has predictable public URLs you can
search with a `site:` query:

| System | Public job board domain |
|---|---|
| Greenhouse | `job-boards.greenhouse.io`, `boards.greenhouse.io` |
| Lever | `jobs.lever.co` |
| Ashby | `jobs.ashbyhq.com` |
| Workday | `*.myworkdayjobs.com` |
| SmartRecruiters | `jobs.smartrecruiters.com` |
| Workable | `apply.workable.com` |
| BambooHR | `*.bamboohr.com/careers` |
| Recruitee | `*.recruitee.com` |
| Teamtailor | `*.teamtailor.com` |
| Personio | `*.jobs.personio.de` |
| Taleo (Oracle) | `*.taleo.net` |
| iCIMS | `careers-*.icims.com` |
| SuccessFactors (SAP) | `career*.successfactors.com` |
| Zoho Recruit | `*.zohorecruit.com` |
| Keka, Darwinbox | common in India |

## By profession — where specialists actually look

**Tech:** Dice, Built In, Wellfound, Otta, Hired, Stack Overflow Jobs, HackerRank Jobs, No Fluff Jobs,
Instahyre, Cutshort, Hirist
**Healthcare:** NHS Jobs, Health eCareers, Nurse.com, PracticeMatch, Practo (India)
**Academia and research:** HigherEdJobs, Times Higher Education, Nature Careers, jobs.ac.uk, Euraxess
**Government and public sector:** USAJobs, Civil Service Jobs, NCS India, EU Careers (EPSO)
**Nonprofit and development:** Idealist, DevNetJobs, ReliefWeb, Impactpool, UN Careers
**Finance:** eFinancialCareers, Wall Street Oasis, Selby Jennings
**Legal:** LawJobs, Legal Cheek, Vahura (India)
**Supply chain and logistics:** SCM Talent, Logistics Job Shop, JobsInLogistics, Careers in Supply Chain
**Creative and design:** Dribbble Jobs, Behance, AIGA, Coroflot, Working Not Working
**Skilled trades and hourly:** Snagajob, Apna, WorkIndia, Indeed
**Education and teaching:** TES, SchoolSpring, Teach Away
**Maritime, aviation, energy:** Rigzone, Oil and Gas Job Search, Maritime-Jobs, AviationJobSearch

---

## What to actually support, and in what order

You cannot integrate this list, and you should not try. A practical order:

1. **Adzuna, Jooble, Careerjet** — the three with real APIs and licences. This is your data layer.
2. **ATS `site:` searches** — free, no API needed, and they surface roles days before the boards.
3. **Named platform search links** — what the tool does now. Zero integration cost, and it takes the
   user exactly where they need to be signed in anyway.
4. **Everything else** — reference material for expanding regional coverage later.

The tool currently generates direct search URLs for about 20 named platforms and falls back to a
targeted Google search for anything it doesn't recognise, so an unknown regional board still produces
something useful rather than a dead end.
