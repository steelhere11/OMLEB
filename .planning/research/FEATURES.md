# Feature Landscape: HVAC Field Service Daily Reporting PWA

**Domain:** HVAC field service daily reporting for commercial maintenance (subcontractor workflow)
**Researched:** 2026-02-23
**Overall confidence:** MEDIUM-HIGH (based on cross-referencing ServiceTitan, Jobber, Housecall Pro, FieldPulse, BuildOps, and multiple field-service-focused sources)

---

## Table Stakes

Features users expect. Missing any of these and the app feels incomplete or untrustworthy vs. the WhatsApp workflow it replaces.

| # | Feature | Why Expected | Complexity | Dependencies | Notes |
|---|---------|--------------|------------|--------------|-------|
| T1 | **Per-equipment service entry** (preventivo/correctivo classification) | Every HVAC reporting tool categorizes work by maintenance type per unit. Technicians think in terms of "which unit, what did I do." This is the atomic unit of the report. | Med | Equipment registry (admin) | Must support multiple equipment entries per daily report. Each entry: equipment ID, maintenance type (preventivo/correctivo), description, status/condition. |
| T2 | **Photo capture with metadata stamps** (date, time, GPS, technician name) | Industry standard. Solocator, Timemark, GPS Map Camera all exist specifically because field photos without metadata are worthless for proof of service. ServiceTitan, BuildOps, FieldPulse all embed photo capture. | Med | Camera API, GPS/geolocation | Stamp must be burned into the image (not just EXIF), so it survives WhatsApp/email forwarding. Minimum: date, time, coordinates, tech name. Stretch: branch name, folio number. |
| T3 | **Digital signature capture** (client on-site manager signs off) | Universal across ServiceTitan, Jobber, Housecall Pro, FieldPulse, BuildOps, Dynamics 365 Field Service. Client sign-off is legal proof of work completion. Currently done on paper or not at all. | Low-Med | Canvas/touch input | Signature tied to specific daily report. Signer name + role captured alongside. |
| T4 | **PDF report generation and export** | Every competitor generates downloadable/emailable PDF reports. Clients (BBVA branch managers, contractor PMs) expect formatted documentation, not raw app data. BuildOps, ServiceTitan, and Sitemate all emphasize branded PDF output. | Med-High | All report data, template engine | Must include: company branding, folio info, per-equipment entries, photos (thumbnails or inline), materials, signatures. Spanish-language formatting. |
| T5 | **Materials/parts used tracking** | ServiceTitan, FieldPulse, BuildOps, and Jobber all track parts used per job. Critical for cost tracking and billing between subcontractor/contractor. Currently tracked informally or forgotten. | Low-Med | Materials catalog (admin) | Per-equipment or per-report. Fields: material name, quantity, unit. No need for inventory management in V1 -- just recording what was used. |
| T6 | **Offline-first operation** | HVAC techs work in basements, mechanical rooms, rooftops, and rural bank branches with poor signal. ServiceTitan saves data locally and syncs when back online. BuildOps, FieldEquip, and Dynamics 365 all highlight offline as essential. PWA makes this harder but still achievable. | High | Service worker, IndexedDB/local storage, sync logic | This is the single hardest table-stakes feature. Must handle: form entry offline, photo capture offline, queue sync on reconnect, conflict resolution. Without this, the app is worse than WhatsApp (which also works offline). |
| T7 | **Daily report submission workflow** (draft -> submit -> reviewed) | Replaces the current "send photos and voice notes to WhatsApp group" chaos. Every field service tool has a job status lifecycle. Technicians need to know "did I finish today's report?" Admins need to know "which reports are pending?" | Med | Auth, report data model | States: Draft (in progress) -> Submitted (tech done) -> Reviewed/Approved (admin). Submitted reports should be immutable to techs. |
| T8 | **Work order / folio context** | ServiceTitan, Jobber, FieldPulse all tie reports to work orders. Technicians must know which folio they're working on, which branch, which client. Without this context, reports are floating documents with no traceability. | Low-Med | Folio/branch/client admin setup | Report is always created under a folio. Folio has: client, branch, date range, assigned crew. Technician sees their assigned folios for today. |
| T9 | **Crew (cuadrilla) assignment and shared reports** | Multiple techs contribute to one daily report for one branch visit. This is specific to the OMLEB workflow but common in commercial HVAC (BuildOps and Fieldwire both support team-based job documentation). | Med | Auth, team/crew data model | A crew of 2+ techs is assigned to a folio. Any crew member can add entries to the day's report. One tech (crew lead) submits. All contributions attributed. |
| T10 | **Technician-friendly mobile UI** | Every competitor emphasizes mobile-first design for technicians with gloves, on ladders, in poor lighting. Housecall Pro, Jobber, and BuildOps all highlight "designed for field use." | Med | Responsive design, touch targets | Large tap targets, minimal typing, smart defaults, quick-action patterns. Spanish-language UI. Must work on cheap Android phones (the reality for many HVAC techs in Mexico). |

---

## Differentiators

Features that set OMLEB apart from generic field service tools. Not expected in a V1 daily-report-only tool, but high value for the specific subcontractor use case.

| # | Feature | Value Proposition | Complexity | Dependencies | Notes |
|---|---------|-------------------|------------|--------------|-------|
| D1 | **Photo annotation/markup (Doodle-style)** | ServiceTitan's Doodle feature lets techs draw on photos to highlight issues. Hugely valuable for explaining problems to non-technical branch managers and contractor PMs reading the PDF report. Reduces "what am I looking at?" questions. | Med | Photo capture (T2), canvas overlay | Draw arrows, circles, text labels on captured photos. Annotated version saved alongside or replacing original. |
| D2 | **Voice-to-text for service notes** | Techs currently use WhatsApp voice notes because typing on a phone while on a roof is miserable. AI transcription (Whisper, Google Speech-to-Text) converts voice to structured text. Dragon Anywhere gets 90%+ accuracy even in noisy environments. FieldPulse notes that "technicians can dictate notes and updates, which AI automatically structures and logs." | Med-High | Speech API, noise handling | Spanish language support essential. Can use browser Web Speech API as starting point, or Whisper API for better accuracy. Offline voice capture (record audio, transcribe when online) is the pragmatic approach. |
| D3 | **QR code equipment identification** | ResQ and ManWinWin use QR/NFC tags on equipment so techs scan to pull up unit info + history instead of manually selecting from a list. Eliminates "wrong equipment selected" errors. Fast for repeat visits. | Low-Med | Camera API, equipment registry | Admin prints/places QR stickers on equipment during initial setup. Tech scans QR -> auto-fills equipment info in report entry. Simple but powerful UX improvement. |
| D4 | **Before/after photo pairing** | ServiceTitan explicitly recommends before-and-after photos. Structuring this in the UI (not just "add photo") creates compelling PDF reports and clear proof of work value. | Low | Photo capture (T2) | UI: "Before" and "After" photo slots per equipment entry. Optional but guided. Renders side-by-side in PDF. |
| D5 | **Report history per equipment** | BuildOps emphasizes "pull up past work on a specific AHU." When a tech visits the same branch monthly, seeing last month's notes on unit #3 saves time and catches recurring issues. | Med | Equipment registry, report storage | Read-only view: "Last 3 reports for this equipment unit." Shown when tech starts a new entry for that unit. |
| D6 | **Smart defaults and templates** | For preventive maintenance on the same equipment types monthly, pre-populating checklist items or common descriptions saves massive time. SafetyCulture and ServiceTitan both offer customizable checklist templates. | Med | Equipment types, template system | Admin configures checklist templates per equipment type. Tech sees pre-filled items, checks off completed, adds notes for exceptions. |
| D7 | **Branded PDF with contractor flexibility** | Most tools generate company-branded PDFs. The differentiator here: support the subcontractor reality where OMLEB does the work but the report might need the contractor's branding (or co-branding) for delivery to the end client (BBVA). | Med | PDF generation (T4), branding config | Admin configures: whose logo appears, whose name is primary. Supports the subcontractor -> contractor -> client chain. |
| D8 | **Admin dashboard with report status overview** | FieldPulse and BuildOps provide real-time dashboards showing job status across all crews. For OMLEB: "Which branches had reports submitted today? Which are still pending? Which need review?" | Med | Report data, admin auth | Table/calendar view: branches x dates, color-coded by report status. Click to view/approve. |
| D9 | **Auto-draft from previous visit** | When a crew returns to the same branch for a multi-day job, auto-create today's report draft with the same folio, branch, and equipment list pre-populated from yesterday. Reduces repetitive setup. | Low-Med | Folio/report history | Detect: same folio, new day, no report yet -> offer "Continue from yesterday?" Pre-fills equipment list, crew stays the same. |
| D10 | **Push notifications for report reminders** | Techs forget to submit daily reports. An end-of-day push notification ("You haven't submitted today's report for Folio #1234") catches missing reports before they become a problem. | Low | PWA push notifications, report status | PWA push notification support varies by platform. iOS Safari support is relatively recent (2023+). Test thoroughly. |

---

## Anti-Features

Features to deliberately NOT build in V1. Common in the field service management space but either out of scope, premature, or actively harmful for a focused daily reporting tool.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| A1 | **Scheduling and dispatching** | ServiceTitan, Jobber, Housecall Pro all center on scheduling. But OMLEB V1 is daily reporting only. Scheduling is a separate product with enormous complexity (calendar UI, availability management, drag-and-drop, notifications). Building it dilutes focus and delays launch by months. | Admin assigns crews to folios manually. Folio has date range. Tech sees "my active folios" -- that is the schedule. |
| A2 | **Invoicing and payments** | Every competitor includes invoicing. But OMLEB's billing is subcontractor-to-contractor, not tech-to-homeowner. The billing workflow is different, likely handled in separate accounting software. Adding invoicing means building payment processing, tax calculations, line items, and more. | PDF report serves as the documentation that supports invoicing done elsewhere. Materials tracking (T5) provides the data needed for manual billing. |
| A3 | **Full inventory management** | ServiceTitan and FieldPulse offer inventory with stock levels, reorder points, barcode scanning, warehouse locations. This is a separate system. V1 only needs "what materials were used on this job today." | Simple materials-used log per report (T5). No stock tracking, no purchase orders, no warehouse management. |
| A4 | **Customer portal / client self-service** | ServiceTitan and Housecall Pro offer customer-facing portals with GPS tracking, appointment booking, payment history. OMLEB's clients are corporate branch managers, not homeowners. They need PDF reports, not a portal. | PDF export via email or WhatsApp share. If needed later, a simple read-only report viewer (not a full portal). |
| A5 | **GPS technician live tracking** | Common in ServiceTitan, Housecall Pro. Requires continuous location streaming, map UI, privacy considerations. Massive battery drain. Not needed when the proof is in the timestamped photos and submitted reports. | GPS coordinates embedded in photo metadata stamps (T2) provide location proof without live tracking. |
| A6 | **Quoting and estimating** | Jobber, Housecall Pro, FieldPulse all include quote generation. Not relevant for a maintenance contract workflow where pricing is pre-agreed. | Out of scope entirely. Pricing is handled in the contract, not in the field. |
| A7 | **CRM and customer relationship management** | ServiceTitan and Housecall Pro include full CRM. OMLEB has a small, known client base (e.g., BBVA). A client/branch registry is needed but a CRM (sales pipeline, lead tracking, follow-ups) is not. | Simple client -> branch -> equipment hierarchy in admin panel. No sales pipeline, no lead management. |
| A8 | **AI-powered diagnostics / troubleshooting** | Housecall Pro's Bluon integration offers equipment database and diagnostic assistance. Impressive but complex, requires large equipment databases, and is a separate product. | Techs document findings manually. The value is in capture and reporting, not in AI diagnosis. |
| A9 | **Multi-language dynamic switching** | Some platforms support runtime language switching. OMLEB's users are all Spanish-speaking. Building i18n infrastructure for a single-language app is waste. | Hard-code Spanish UI. If English is ever needed, add i18n then (it is easier to add later to a small app than to maintain from day one). |
| A10 | **Time tracking / payroll integration** | Workyard and others emphasize time tracking with clock in/out. Not the problem OMLEB solves. Time tracking is a separate HR/payroll concern. | Report has arrival/departure time fields (for the client's benefit in the PDF), but no timesheet/payroll features. |

---

## Feature Dependencies

```
Equipment Registry (Admin) ─────────────────────────────────────────────┐
  |                                                                      |
  v                                                                      v
Folio/Work Order Setup (Admin) ──> Crew Assignment (T9)          QR Code Tags (D3)
  |                                     |
  v                                     v
Daily Report Creation (T8) ──────> Crew Shared Report (T9)
  |
  |──> Per-Equipment Entry (T1)
  |      |──> Photo Capture + Metadata (T2)
  |      |      |──> Photo Annotation (D1)
  |      |      └──> Before/After Pairing (D4)
  |      |──> Materials Used (T5)
  |      |──> Voice-to-Text Notes (D2)
  |      └──> Equipment History View (D5)
  |
  |──> Digital Signature (T3)
  |
  └──> Report Submission Workflow (T7)
         |──> PDF Generation (T4) ──> Branded PDF (D7)
         └──> Admin Dashboard (D8)
               └──> Push Notifications (D10)

Offline-First (T6) ──> Underpins ALL of the above
                       (must be designed into the architecture from day 0,
                        not bolted on later)

Auto-Draft from Previous Visit (D9) ──> Requires: Report History + Folio context
Smart Defaults/Templates (D6) ──> Requires: Equipment Types + Template admin UI
```

### Critical path:
1. **Offline-first architecture (T6)** must be designed first -- it affects every other feature's data layer
2. **Equipment registry + Folio setup** (admin) must exist before any technician features work
3. **Per-equipment entry (T1) + Photo capture (T2)** are the core value -- build these immediately after the data foundation
4. **PDF generation (T4)** is the primary output the client sees -- must work before launch
5. **Digital signature (T3)** completes the legal chain of documentation

---

## MVP Recommendation

### Must have for launch (V1):
1. **T1** - Per-equipment service entries (preventivo/correctivo)
2. **T2** - Photo capture with burned-in metadata stamps
3. **T3** - Digital signature from client's on-site manager
4. **T4** - PDF report generation with branding
5. **T5** - Materials/parts used log
6. **T6** - Offline-first operation (at minimum: complete report entry offline, sync when online)
7. **T7** - Report submission workflow (draft -> submitted)
8. **T8** - Folio/work order context
9. **T9** - Crew shared reports
10. **T10** - Mobile-first Spanish UI

### High-value additions for V1.1 (post-launch, quick wins):
- **D3** - QR code equipment scan (low complexity, high UX impact)
- **D4** - Before/after photo pairing (low complexity, high report quality)
- **D9** - Auto-draft from previous visit (low complexity, saves daily tedium)
- **D10** - Push notification reminders (low complexity if PWA push works on target devices)

### Defer to V2+ (significant complexity or separate concern):
- **D1** - Photo annotation/markup (medium complexity, needs canvas library)
- **D2** - Voice-to-text notes (medium-high complexity, Spanish accuracy, offline challenge)
- **D5** - Equipment report history (requires enough data accumulated to be useful)
- **D6** - Smart defaults/templates (requires understanding actual usage patterns first)
- **D7** - Contractor-flexible branding (requires multi-tenant branding system)
- **D8** - Admin dashboard with status overview (useful but admin can check reports manually at first)

---

## Confidence Assessment

| Finding | Confidence | Basis |
|---------|------------|-------|
| Table stakes features list | HIGH | Cross-verified across ServiceTitan, Jobber, Housecall Pro, FieldPulse, BuildOps -- consistent feature set across all major players |
| Photo metadata stamps as standard | HIGH | Multiple dedicated apps (Solocator, Timemark, GPS Map Camera) exist solely for this; all major FSM tools include photo capture |
| Offline-first as requirement | HIGH | Universally emphasized across BuildOps, ServiceTitan, FieldEquip, Dynamics 365; particularly critical for Mexico commercial building contexts |
| Digital signature as standard | HIGH | Present in every major FSM tool researched; multiple sources confirm legal/proof-of-service value |
| PDF report generation as standard | HIGH | Universal across competitors; multiple template providers (SafetyCulture, Sitemate, ServiceTitan) |
| Voice-to-text as differentiator (not table stakes) | MEDIUM | Only FieldPulse and BuildOps mention AI dictation; most tools still rely on typed notes; emerging but not yet expected |
| QR equipment tagging value | MEDIUM | ResQ and ManWinWin implement it; not universal yet; pragmatic value for repeat-visit commercial maintenance |
| Crew collaboration on shared reports | MEDIUM | BuildOps and Fieldwire support team documentation; less common in residential-focused tools (Jobber, Housecall Pro) but standard for commercial |

---

## Sources

- [ServiceTitan HVAC Software](https://www.servicetitan.com/industries/hvac-software) - Feature overview, mobile app capabilities
- [ServiceTitan Photo/Doodle Documentation](https://help.servicetitan.com/how-to/take-photos-use-doodle) - Photo markup feature details
- [ServiceTitan Commercial Playbook](https://www.servicetitan.com/commercial-playbook/commercial-work-orders) - Commercial work order best practices
- [Jobber HVAC Software](https://www.getjobber.com/industries/hvac/) - Scheduling, dispatching, work orders
- [Housecall Pro Mobile App](https://www.housecallpro.com/features/mobile-app/) - Technician mobile features
- [Housecall Pro Fall 2025 Updates](https://www.housecallpro.com/resources/fall-2025-product-updates/) - Recent feature additions
- [FieldPulse HVAC Software](https://www.fieldpulse.com/solutions/hvac-r) - Reporting, dashboards, mobile features
- [BuildOps HVAC Service Report Guide](https://buildops.com/resources/hvac-service-report/) - Commercial HVAC reporting best practices
- [BuildOps HVAC Service Report Apps](https://buildops.com/resources/hvac-service-report-app/) - Mobile reporting features
- [BuildOps Commercial HVAC FSM](https://buildops.com/resources/commercial-hvac-field-service-software/) - Commercial-specific features
- [SafetyCulture HVAC Checklists](https://safetyculture.com/checklists/hvac-maintenance) - Preventive maintenance templates
- [Sitemate HVAC Checklist Template](https://sitemate.com/templates/plant-equipment-assets/forms/preventative-maintenance-checklist-for-hvac/) - Digital form capabilities
- [Solocator GPS Field Camera](https://solocator.com/) - Photo timestamp/GPS stamping
- [Timemark Photo Management](https://www.timemark.com) - Field photo documentation with stamps
- [ManWinWin QR/NFC Tags](https://www.manwinwin.com/qr-codes-nfc-tags-maintenance/) - Equipment tagging for maintenance
- [Fieldwire Jobsite Management](https://www.fieldwire.com/) - Multi-day project team collaboration
- [FieldEquip Mobile FSM](https://www.fieldequip.com/mobile-field-service-management-software/) - Offline capabilities, digital signatures
- [Dynamics 365 Field Service Reports](https://learn.microsoft.com/en-us/dynamics365/field-service/mobile/create-service-report) - Custom report generation
- [GoCanvas HVAC Field Service Form](https://www.gocanvas.com/mobile-forms-apps/3766-HVAC-Field-Service-Report) - Mobile form template
- [FieldCamp Field Service Reports](https://fieldcamp.ai/blog/field-service-reports/) - Report templates and best practices
- [Praxedo HVAC FSM Guide 2025](https://www.praxedo.com/our-blog/why-is-mobile-field-service-software-for-hvac-essential-in-2025-your-complete-guide/) - Mobile field service essentials
- [Workyard Field Service Apps 2025](https://www.workyard.com/compare/field-service-app) - Team collaboration features
