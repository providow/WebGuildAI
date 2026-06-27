# GHL Inbound Voice AI Agent Setup Framework

A CLI-driven code system that generates all production-ready artifacts to configure a GoHighLevel Inbound Voice AI Agent for any local service business.

---

## Prerequisites

- Node.js 18+ (no npm install required — uses Node stdlib only)
- GHL sub-account with Voice AI enabled
- A2P 10DLC registration completed on the sending number before go-live (see warnings below)

---

## Quick Start

```bash
cd ghl-agent-setup

# 1. Edit intake-form.json with your client's details
# 2. Run the generator
node generate-all.js

# All artifacts appear in output/
```

To use a different intake file for a different client:

```bash
node generate-all.js path/to/client-intake.json
```

---

## Intake Form Fields

Edit `intake-form.json` before running. Required fields:

| Field | Description |
|---|---|
| `business_name` | Full legal or DBA business name |
| `agent_name` | First name the AI agent will use ("Alex", "Sam", etc.) |
| `industry` | Industry type (HVAC, Plumbing, Electrical, etc.) |
| `transfer_number` | **Required.** Phone number for human handoff — must be set or generator exits with error |
| `services` | Array of service names the business offers |
| `pricing_policy` | Approved pricing statement. Do not include specific prices that may change — push those to the KB FAQ instead |
| `service_areas.cities` | Array of city names served |
| `service_areas.zip_codes` | Array of ZIP codes served — agent checks these at eligibility gate |
| `operating_hours` | Per-day open/close times in 24h format + IANA timezone string |
| `faqs` | Array of `{ question, answer }` objects — pushed to Knowledge Base, not the system prompt |
| `emergency_policy` | After-hours and emergency escalation policy text |
| `technician_email` | Dispatch email address for post-booking notifications |
| `brand_voice` | Tone/personality guidance for the agent (2–3 sentences) |
| `ghl_location_id` | GHL sub-account Location ID (found in GHL > Settings > Business Info) |
| `phone_number_country` | `"US"`, `"PH"`, or `"other"` — triggers cost warning for Philippine numbers |
| `calendar_id` | GHL Calendar ID for appointment booking action |
| `appointment_duration_minutes` | Default appointment slot length |

---

## Output Files

All files are written to `output/` after running `generate-all.js`:

| File | Purpose | Where it goes in GHL |
|---|---|---|
| `system-prompt.txt` | GHL Advanced Mode system prompt | Sub-Account > AI Agents > Voice AI > Inbound > Agent > System Prompt |
| `knowledge-base-content.md` | Knowledge Base reference document | Sub-Account > AI Agents > Knowledge Base > paste content |
| `post-call-workflow-spec.json` | Post-call automation blueprint | Sub-Account > Automation > Workflows (manual build — see spec) |
| `ghl-setup-checklist.md` | Phase-by-phase setup guide | Use during setup; share with GHL admin |
| `test-checklist.md` | End-to-end testing checklist | Complete before going live |

---

## Known Constraints & Warnings

### ⚠️ Always Use Advanced Mode
GHL Basic Mode is insufficient for production. Every generated system prompt is structured for Advanced Mode only. Never configure the agent in Basic Mode.

### ⚠️ System Prompt Word Count
GHL recommends staying under 2,000 words for optimal LLM performance. The generator checks word count and warns if exceeded. Move additional content (more FAQs, extended pricing tables) to the Knowledge Base — not the system prompt.

### ⚠️ A2P 10DLC Registration
Before any SMS automation step can deliver messages, the sending phone number must be registered and approved under A2P 10DLC. Non-approved numbers fail silently — the workflow runs without error but SMS is never delivered. Register at: **Sub-Account > Settings > Phone Numbers > A2P Registration**.

### ⚠️ Contact Name Bug
GHL defaults the contact's name to the sub-account admin name if the system prompt doesn't explicitly instruct the agent to collect the caller's name first. The generated system prompt hardcodes name collection as step #1 of data collection. Do not remove or reorder this step.

### ⚠️ Knowledge Base Propagation Delay
After saving or updating the Knowledge Base, wait 1–2 minutes before testing. The agent does not have access to Knowledge Base changes instantly.

### ⚠️ Time Zone Alignment
Three separate time zone settings must all match:
1. Sub-account default time zone (Settings > Business Info)
2. Calendar time zone (Calendars > [calendar] > Settings)
3. Agent time zone (AI Agents > Voice AI > Inbound > [agent] > Settings)

A mismatch causes appointments to be booked at the wrong time. The setup checklist includes a triple-check step.

### ⚠️ Philippine Number Pricing
If `phone_number_country` is set to `"PH"` in the intake form, the setup checklist flags this. US numbers cost ~$0.15/month; PH numbers cost $15–$120+/month. Confirm with the client before purchasing.

### ⚠️ Human Handoff Is Non-Negotiable
The generator exits with an error if `transfer_number` is not set in the intake form. Deploying a voice AI agent without a human escalation path is a production blocker.

---

## Multi-Client Scaling

### Per-Client Intake Files
Name each client's intake file descriptively:
```
intake-apex-hvac.json
intake-citywide-plumbing.json
intake-greenleaf-landscaping.json
```

Run per client:
```bash
node generate-all.js intake-apex-hvac.json
```

Each run overwrites `output/` — if you need to retain previous output, copy the `output/` folder to a client-named directory before the next run:
```bash
cp -r output apex-hvac-output
```

### GHL Snapshot Scaling
For agency deployments with many clients on the same business type (e.g., 10 HVAC clients):
1. Set up one fully configured sub-account as the "master template"
2. Export a GHL Snapshot: **Agency > Snapshots > Export Sub-Account**
3. When onboarding a new client: import the Snapshot into a new sub-account
4. Run the generator with the new client's intake form to produce updated artifacts
5. Manually update the system prompt, Knowledge Base, and email/phone fields in the new sub-account

The Snapshot carries workflow structure, calendar setup, and agent configuration — the generator output customizes the content layer on top.

### What Cannot Be Snaphotted
GHL Snapshots do not carry:
- Phone number assignments (must reassign per sub-account)
- A2P 10DLC registration (must re-register per number)
- AI Agent system prompt content (must paste from `output/system-prompt.txt`)
- Knowledge Base content (must paste from `output/knowledge-base-content.md`)

The setup checklist accounts for these gaps — complete all checklist phases even after a Snapshot import.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Agent uses admin name for contacts | Missing name collection step in system prompt | Verify system prompt starts with name collection as step #1 |
| Appointments booked at wrong time | Time zone mismatch | Align sub-account, calendar, and agent time zones |
| SMS not delivered | A2P 10DLC not approved | Complete A2P registration for sending number |
| Agent gives wrong FAQ answers | KB not propagated | Wait 1–2 min after KB save; retest |
| Agent books out-of-area caller | ZIP/city list missing or wrong | Update `service_areas` in intake form and regenerate |
| Agent won't transfer call | Transfer number not set in Actions | Add Call Transfer action with correct number |
| System prompt too long | FAQs or pricing inlined in prompt | Move to Knowledge Base; regenerate |

---

*WebGuildAI GHL Agent Setup Framework*
*Part of the WebGuildAI automation toolkit*
