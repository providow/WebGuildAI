#!/usr/bin/env node
// Generates the primary output: ghl-workflow-guide.md
// A single, top-to-bottom document GHL admins follow from account prep through go-live.
// All copy-paste content (system prompt, KB, workflow spec, SMS templates) is embedded inline.

const fs = require('fs');
const path = require('path');

const intakePath = process.argv[2] || path.join(__dirname, 'intake-form.json');
const outputDir = path.join(__dirname, 'output');

function load(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Intake form not found at ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatHoursTable(hours) {
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  return days.map(d => {
    const h = hours[d];
    if (!h || h.open === 'closed') return `| ${capitalize(d)} | Closed |`;
    return `| ${capitalize(d)} | ${h.open} – ${h.close} |`;
  }).join('\n');
}

function formatHoursText(hours) {
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  return days.map(d => {
    const h = hours[d];
    if (!h || h.open === 'closed') return `  ${capitalize(d)}: Closed`;
    return `  ${capitalize(d)}: ${h.open} – ${h.close}`;
  }).join('\n');
}

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function buildSystemPrompt(intake) {
  const serviceList = intake.services.map(s => `- ${s}`).join('\n');
  const cityList = intake.service_areas.cities.join(', ');
  const zipList = intake.service_areas.zip_codes.join(', ');
  const hours = formatHoursText(intake.operating_hours);
  const tz = intake.operating_hours.timezone;

  return `## AGENT IDENTITY & BRAND VOICE

You are ${intake.agent_name}, a virtual scheduling assistant for ${intake.business_name}. ${intake.brand_voice}

You handle inbound calls only. You book appointments, answer general questions, and transfer callers who need immediate human assistance. You do not perform technical diagnostics or quote exact repair prices.

---

## SCOPE & BOUNDARIES

You WILL:
- Collect caller information and book appointments on the ${intake.business_name} calendar
- Answer questions about services, service areas, and operating hours
- Transfer calls to a live agent when requested or when the situation requires it
- Handle emergency service inquiries per the emergency protocol below

You WILL NOT:
- Diagnose equipment problems or quote repair prices
- Book appointments outside the confirmed service area
- Provide pricing beyond the approved pricing policy
- Discuss competitor companies

Always refer detailed technical questions to the technician: "A certified technician will be able to give you a precise answer when they visit."

---

## DATA COLLECTION REQUIREMENTS

Collect the following in this exact order. Do not skip or reorder steps.

1. **Full name** — "May I get your full name?" (CRITICAL: collect this first — never leave the contact name as the default system name)
2. **Callback phone number** — confirm the number you're calling from or get an alternate
3. **Service address** — full street address including city and ZIP code
4. **Email address** — for appointment confirmation
5. **Service needed** — what issue or service they're calling about
6. **Preferred appointment date and time** — offer options within operating hours

Do not proceed to booking until all 6 fields are collected.

---

## SERVICE AREA ELIGIBILITY CHECK

${intake.business_name} serves the following areas only:

Cities: ${cityList}
ZIP codes: ${zipList}

After collecting the caller's address, verify their ZIP code or city is in the list above.

If the caller is OUTSIDE the service area:
"I'm sorry, we don't currently service that area. Our coverage includes ${cityList}. I'd recommend searching for a local provider in your area. Is there anything else I can help you with?"

Do not attempt to book an appointment for out-of-area callers under any circumstances.

---

## APPOINTMENT BOOKING LOGIC

Operating hours (${tz}):
${hours}

Appointment duration: ${intake.appointment_duration_minutes} minutes.

After confirming the caller is in the service area and all data is collected:
1. Offer 2–3 available time slots within operating hours
2. Confirm the selected time, date, service address, and service type with the caller
3. Use the Appointment Booking action to create the appointment
4. Provide the confirmation: "I've booked your appointment for [DATE] at [TIME]. You'll receive a confirmation text and email shortly."

If no slots are available in the caller's preferred window, offer the next available slot. If the caller cannot find a suitable time, transfer to a live agent.

---

## HUMAN HANDOFF TRIGGERS

Transfer the call immediately to ${intake.transfer_number} if any of the following occur:
- Caller explicitly requests to speak with a person
- Caller expresses frustration or repeats the same question more than twice
- Caller has a complaint about a previous service visit
- Caller needs pricing information beyond the approved policy
- Caller has an active system failure with health/safety implications

To transfer: "I'm going to connect you with one of our team members right now. Please hold for just a moment."

Then trigger the Call Transfer action to ${intake.transfer_number}.

---

## EMERGENCY HANDLING PROTOCOL

${intake.emergency_policy}

If a caller describes an emergency (no heat, no AC in extreme weather, gas smell, flooding from equipment, electrical sparks):
1. Acknowledge the urgency: "I understand this is urgent and I want to get help to you right away."
2. Collect name, address, and callback number immediately
3. If during operating hours: transfer to ${intake.transfer_number}
4. If after hours: "Our on-call technician will contact you within 30 minutes. I'm logging your information now." Then trigger the Emergency Workflow action.

Do not put an emergency caller on hold or ask non-essential questions before capturing contact info.

---

## CLOSING / CONFIRMATION SCRIPT

After a successful booking:
"Perfect, [CALLER NAME]. You're all set. A technician will be at [ADDRESS] on [DATE] at [TIME] for your [SERVICE TYPE]. You'll receive a confirmation text to [PHONE] and an email to [EMAIL]. Is there anything else I can help you with today?"

If the caller has no further questions: "Thank you for calling ${intake.business_name}. Have a great day!"`;
}

function buildKBContent(intake) {
  const serviceRows = intake.services.map(s => `| ${s} | See technician for details |`).join('\n');
  const cityList = intake.service_areas.cities.join(', ');
  const zipList = intake.service_areas.zip_codes.map(z => `- ${z}`).join('\n');
  const faqSection = intake.faqs.map(f => `**Q: ${f.question}**\n\nA: ${f.answer}`).join('\n\n---\n\n');
  const mainPlan = intake.maintenance_plan_name || 'Maintenance Plan';
  const mainPrice = intake.maintenance_plan_price || 'Contact us for pricing';

  return `# ${intake.business_name} — Agent Knowledge Base

## Services Offered

| Service | Notes |
|---|---|
${serviceRows}

---

## Pricing Policy

${intake.pricing_policy}

---

## Service Area Coverage

**Serving the following cities:** ${cityList}

**ZIP codes covered:**
${zipList}

---

## Operating Hours

| Day | Hours |
|---|---|
${formatHoursTable(intake.operating_hours)}

**Timezone:** ${intake.operating_hours.timezone}

Emergency service is available 24/7.

---

## Frequently Asked Questions

${faqSection}

---

## Emergency Policy

${intake.emergency_policy}

---

## Maintenance / Service Plan

**Plan Name:** ${mainPlan}
**Price:** ${mainPrice}

Benefits: Two annual tune-ups, priority scheduling, 15% off repairs, no diagnostic fees for plan members.

---

## Warranty Information

- Labor warranty: 1 year on all installations and replacements
- Parts warranty: Manufacturer warranty applies (typically 5–10 years)

---

## Seasonal Promotions

*(Update this section each season. Remove expired promotions before testing.)*`;
}

function buildSMSTemplate(intake) {
  return `Hi {{contact.first_name}}, this is ${intake.business_name} confirming your appointment on {{appointment.start_date_time}} at {{contact.address1}}. Your technician will contact you 30 min before arrival. Questions? Call us at {{location.phone}}. Reply STOP to opt out.`;
}

function buildEmailSubject() {
  return `New AI Booking — {{contact.full_name}} | {{appointment.start_date_time}}`;
}

function buildEmailBody(intake) {
  return `A new appointment was booked by the AI agent.

Customer: {{contact.full_name}}
Phone: {{contact.phone}}
Email: {{contact.email}}
Address: {{contact.address1}}, {{contact.city}}, {{contact.state}} {{contact.postal_code}}
Service: {{appointment.title}}
Date/Time: {{appointment.start_date_time}}
Calendar: {{appointment.calendar_name}}

Booked via: ${intake.agent_name} Voice AI Agent`;
}

function generate(intake) {
  const systemPrompt = buildSystemPrompt(intake);
  const wordCount = countWords(systemPrompt);
  const wordCountWarning = wordCount > 2000
    ? `> **⚠️ WORD COUNT WARNING:** System prompt is ${wordCount} words — exceeds the 2,000-word GHL limit. Move content to the Knowledge Base and regenerate.\n\n`
    : `> System prompt word count: **${wordCount} / 2,000** ✓\n\n`;

  const kbContent = buildKBContent(intake);
  const smsTemplate = buildSMSTemplate(intake);
  const emailSubject = buildEmailSubject();
  const emailBody = buildEmailBody(intake);
  const today = new Date().toISOString().split('T')[0];

  return `# GHL Inbound Voice AI Agent — Setup Workflow
## ${intake.business_name} · Agent: ${intake.agent_name} · ${today}

> **How to use this document:**
> Work through each phase in order, top to bottom. Every code block contains the exact content to copy and paste into GHL — no other files needed. Complete every checkbox before moving to the next phase.

---

## Pre-Flight Checklist

Before starting, confirm you have:

- [ ] Agency-level or sub-account admin access to the **${intake.business_name}** sub-account
- [ ] The inbound phone number that will be assigned to this agent
- [ ] Access to the technician dispatch inbox: \`${intake.technician_email}\`
- [ ] A2P 10DLC registration status confirmed (see Phase 1)
- [ ] GHL calendar created and ready for this sub-account

---

## Phase 1 — Sub-Account Preparation

**Navigate to:** \`Sub-Account > Settings > Business Info\`

- [ ] Confirm sub-account name is **${intake.business_name}**
- [ ] Confirm time zone is set to **${intake.operating_hours.timezone}**
  > **⚠️ TIME ZONE IS CRITICAL.** This must match the calendar time zone and the agent time zone. A mismatch books appointments at the wrong time. Lock this in before touching anything else.

**Navigate to:** \`Sub-Account > Settings > Phone Numbers\`

- [ ] Confirm an inbound number is assigned to this sub-account
- [ ] Phone number country: **${intake.phone_number_country}**
  ${intake.phone_number_country === 'PH'
    ? '> **⚠️ PHILIPPINE NUMBER DETECTED.** PH numbers cost $15–$120+/month vs ~$0.15/month for US numbers. Confirm this is intentional before proceeding.'
    : '> US numbers cost ~$0.15/month. If you are purchasing a new number, confirm the country — Philippine (PH) numbers cost $15–$120+/month.'}

**Navigate to:** \`Sub-Account > Settings > Phone Numbers > A2P Registration\`

- [ ] A2P 10DLC status: ☐ Approved &nbsp;|&nbsp; ☐ Pending &nbsp;|&nbsp; ☐ Not started
  > **⚠️ SMS WILL NOT DELIVER without A2P approval.** The workflow runs silently — no error, no SMS. Do not go live until this is approved. If not started, register now and continue setup in parallel.

---

## Phase 2 — Create the Voice AI Agent

**Navigate to:** \`Sub-Account > AI Agents > Voice AI > Inbound > + Create Agent\`

- [ ] Agent Name: **${intake.agent_name}**
- [ ] Agent Type: **Inbound**
- [ ] Mode: **Advanced Mode** ← toggle this before pasting anything
  > **⚠️ NEVER USE BASIC MODE.** Basic Mode cannot support the conditional logic, data collection sequence, or handoff triggers this agent requires. If GHL defaults to Basic Mode, toggle to Advanced Mode first.
- [ ] Time zone: **${intake.operating_hours.timezone}** (must match sub-account)

**Copy the entire block below and paste into the System Prompt field:**

${wordCountWarning}\`\`\`
${systemPrompt}
\`\`\`

- [ ] System prompt pasted
- [ ] Confirm the prompt opens with name collection as step #1 under DATA COLLECTION REQUIREMENTS
  > **⚠️ CONTACT NAME BUG.** If the agent does not collect the caller's name first, GHL writes the sub-account admin name to the contact record. The prompt above fixes this — do not remove or reorder the data collection steps.
- [ ] Save the agent (do not assign a phone number yet — that is Phase 7)

---

## Phase 3 — Knowledge Base

**Navigate to:** \`Sub-Account > AI Agents > Knowledge Base > + New\`

- [ ] Knowledge Base name: **${intake.business_name} — Agent KB**

**Copy the entire block below and paste into the Knowledge Base content editor:**

\`\`\`
${kbContent}
\`\`\`

- [ ] Content pasted
- [ ] Save the Knowledge Base
- [ ] Navigate back to the agent: \`AI Agents > Voice AI > Inbound > ${intake.agent_name} > Knowledge Base tab\`
- [ ] Attach **${intake.business_name} — Agent KB** to this agent
- [ ] Save

> **⚠️ PROPAGATION DELAY.** After saving the Knowledge Base, wait **at least 2 minutes** before testing. The agent does not have access to Knowledge Base changes instantly. Set a timer — testing too early produces incorrect results and wastes time diagnosing a non-issue.

---

## Phase 4 — Agent Actions

Three actions are required. Missing any one of them is a production blocker.

**Navigate to:** \`AI Agents > Voice AI > Inbound > ${intake.agent_name} > Actions\`

### Action 1 of 3 — Human Handoff (Call Transfer)

- [ ] Click **+ Add Action > Call Transfer**
- [ ] Action name: \`Transfer to Live Agent\`
- [ ] Transfer number: \`${intake.transfer_number}\`
- [ ] Save
  > **⚠️ NON-NEGOTIABLE.** Without this action, callers who request a human or hit a dead end have no escalation path. This is a go-live blocker.

### Action 2 of 3 — Appointment Booking

- [ ] Click **+ Add Action > Appointment Booking**
- [ ] Action name: \`Book Appointment\`
- [ ] Calendar: select the calendar for **${intake.business_name}**
- [ ] Confirm the calendar time zone is **${intake.operating_hours.timezone}**
  > **⚠️ TIME ZONE CHECK #2.** Calendar time zone must match sub-account time zone. Verify before saving.
- [ ] Save

### Action 3 of 3 — Emergency Workflow Trigger

- [ ] Click **+ Add Action > Workflow Trigger**
- [ ] Action name: \`Emergency Escalation\`
- [ ] Workflow: \`${intake.business_name} — Emergency Call Handler\`
  > If this workflow does not exist yet, create it in \`Automation > Workflows\` before completing this step. Minimum viable emergency workflow: Tag contact "Emergency", send internal email to \`${intake.technician_email}\`.
- [ ] Save

**Phase 4 sign-off:**
- [ ] All 3 actions created and saved
- [ ] No action shows an error or "not configured" state

---

## Phase 5 — Calendar Configuration

**Navigate to:** \`Sub-Account > Calendars > [select calendar for ${intake.business_name}]\`

- [ ] Calendar type: **Personal Booking** (or per-technician if multiple technicians)
- [ ] Appointment duration: **${intake.appointment_duration_minutes} minutes**
- [ ] Availability slots match operating hours:

| Day | Hours |
|---|---|
${formatHoursTable(intake.operating_hours)}

- [ ] **Time zone triple-check** — all three must match:

| Setting | Required Value | Actual Value |
|---|---|---|
| Sub-account time zone | ${intake.operating_hours.timezone} | &nbsp; |
| Calendar time zone | ${intake.operating_hours.timezone} | &nbsp; |
| Agent time zone | ${intake.operating_hours.timezone} | &nbsp; |

> If any row doesn't match, fix it now. Time zone drift is the most common reason appointments appear at the wrong time after go-live.

- [ ] Buffer time between appointments: recommended 15 min
- [ ] Save calendar settings

---

## Phase 6 — Post-Call Automation Workflow

**Navigate to:** \`Sub-Account > Automation > Workflows > + New Workflow\`

> **⚠️ MANUAL BUILD REQUIRED.** GHL has no API endpoint to create workflows programmatically. Build it step by step below.

- [ ] Workflow name: \`${intake.business_name} — Post-Call AI Booking Automation\`
- [ ] Status: **Draft** (publish after all steps are confirmed)

**Step 1 — Trigger**
- [ ] Trigger type: **Appointment Booked by AI Agent**
- [ ] Filter: calendar = [select ${intake.business_name} calendar]

**Step 2 — Wait (5 seconds)**
- [ ] Add action: **Wait** · Duration: 5 seconds
- [ ] Purpose: ensures contact record is fully written before downstream actions read from it

**Step 3 — SMS Confirmation to Customer**

> **⚠️ A2P REQUIRED.** Only add this step if A2P 10DLC is approved. If still pending, skip for now and add after approval.

- [ ] Add action: **Send SMS**
- [ ] From: assigned inbound number
- [ ] To: \`{{contact.phone}}\`
- [ ] Message body — copy exactly:

\`\`\`
${smsTemplate}
\`\`\`

**Step 4 — Email Notification to Dispatch**

- [ ] Add action: **Send Email**
- [ ] To: \`${intake.technician_email}\`
- [ ] Subject — copy exactly:

\`\`\`
${emailSubject}
\`\`\`

- [ ] Body — copy exactly:

\`\`\`
${emailBody}
\`\`\`

**Step 5 — Tag the Contact**

- [ ] Add action: **Add Tag** · Tag: \`Booked by AI\`
- [ ] Add action: **Add Tag** · Tag: \`AI - ${intake.industry}\`

**Publish the workflow:**
- [ ] Review all 5 steps — confirm no red error states
- [ ] Set workflow status to **Published**
- [ ] Save

---

## Phase 7 — Assign Phone Number to Agent

**Navigate to:** \`Sub-Account > AI Agents > Voice AI > Inbound > ${intake.agent_name}\`

- [ ] Assign the inbound phone number to this agent
- [ ] Confirm this number is not also assigned to another agent, IVR, or call routing rule
  > Double-assignment causes unpredictable routing behavior — calls may go to the wrong destination.
- [ ] Save

---

## Phase 8 — End-to-End Testing

> **Start the 2-minute Knowledge Base timer now if you haven't already.** Do not run tests until it has elapsed.

Run each scenario using **GHL Web Call**: \`AI Agents > Voice AI > Inbound > ${intake.agent_name} > Test Agent\`

Keep the **Conversations** view open in a second tab to watch contact creation in real time.

### Test 1 — Normal Booking ✅

Say: *"Hi, I need my ${intake.services[0].toLowerCase()} looked at."*

| Check | Expected | Pass? |
|---|---|---|
| Agent greets as ${intake.agent_name} from ${intake.business_name} | ✓ | &nbsp; |
| First question is caller's full name | ✓ | &nbsp; |
| Collects all 6 data fields before booking | ✓ | &nbsp; |
| Confirms address is in service area (use ZIP: ${intake.service_areas.zip_codes[0]}) | ✓ | &nbsp; |
| Offers time slots within operating hours | ✓ | &nbsp; |
| Books appointment and gives verbal confirmation | ✓ | &nbsp; |
| Contact created in GHL with correct name (not admin name) | ✓ | &nbsp; |
| Appointment in calendar at correct time + time zone | ✓ | &nbsp; |
| Contact tagged: Booked by AI | ✓ | &nbsp; |
| SMS delivered to test number | ✓ | &nbsp; |
| Email delivered to ${intake.technician_email} | ✓ | &nbsp; |

> **⚠️ CONTACT NAME CHECK.** If the contact shows the sub-account admin name instead of the name you gave, the system prompt name collection step is broken. Do not go live — fix and retest.

### Test 2 — Out-of-Area Rejection ❌

Say: *"I'm in [city not in service area] — can you come out?"*

| Check | Expected | Pass? |
|---|---|---|
| Agent identifies out-of-area address | ✓ | &nbsp; |
| Agent politely declines and names covered cities | ✓ | &nbsp; |
| No appointment created in calendar | ✓ | &nbsp; |
| No "Booked by AI" tag applied | ✓ | &nbsp; |

### Test 3 — Human Handoff 🔄

Say: *"I'd like to speak with a real person please."*

| Check | Expected | Pass? |
|---|---|---|
| Agent acknowledges immediately (no pushback) | ✓ | &nbsp; |
| Agent says "I'm going to connect you now" | ✓ | &nbsp; |
| Call transfers to ${intake.transfer_number} | ✓ | &nbsp; |

Also test: repeat the same question 3 times → agent should offer transfer.

### Test 4 — Emergency Call 🚨

Say: *"My heat is completely out and it's freezing — I have kids at home."*

| Check | Expected | Pass? |
|---|---|---|
| Agent acknowledges urgency immediately | ✓ | &nbsp; |
| Agent captures name + address + phone before anything else | ✓ | &nbsp; |
| If business hours: transfers to ${intake.transfer_number} | ✓ | &nbsp; |
| If after hours: confirms on-call dispatch within 30 min | ✓ | &nbsp; |
| Emergency workflow triggered | ✓ | &nbsp; |

### Test 5 — Knowledge Base Accuracy 📚

| Question | Expected Answer Source | Pass? |
|---|---|---|
| "Do you offer financing?" | KB > FAQs | &nbsp; |
| "What brands do you service?" | KB > FAQs | &nbsp; |
| "How much is a diagnostic?" | KB > Pricing Policy | &nbsp; |
| "Are your techs licensed?" | KB > FAQs | &nbsp; |

> If answers are wrong or fabricated, the Knowledge Base has not fully propagated. Wait 60 more seconds and retest before investigating further.

---

## Go-Live Sign-Off

Complete this before activating live inbound calls.

| Requirement | Status |
|---|---|
| All 7 setup phases complete | ☐ |
| All 5 test scenarios passed | ☐ |
| Contact name bug confirmed absent | ☐ |
| Time zone confirmed on all booked appointments | ☐ |
| A2P 10DLC approved on sending number | ☐ |
| All 3 agent actions configured | ☐ |
| Post-call workflow published | ☐ |
| Phone number assigned to agent only | ☐ |

**Signed off by:** _______________________ **Date:** _______________________

---

## Troubleshooting Reference

| Symptom | Most Likely Cause | Fix |
|---|---|---|
| Contact shows admin name | Name collection not first in prompt | Verify DATA COLLECTION section starts with name |
| Appointment at wrong time | Time zone mismatch | Align sub-account, calendar, and agent TZ |
| SMS not received | A2P not approved | Complete A2P registration; confirm number is approved |
| Agent gives wrong FAQ answers | KB not propagated | Wait 2 min after KB save and retest |
| Agent books out-of-area caller | ZIP list incomplete | Update service_areas in intake form and regenerate |
| Caller can't reach human | Transfer action missing or wrong number | Check Actions > Call Transfer |
| Workflow doesn't fire | Trigger type wrong or calendar not selected | Verify trigger is "Appointment Booked by AI Agent" with correct calendar |

---

*Generated by WebGuildAI GHL Agent Setup Framework · ${today}*
*Client: ${intake.business_name} · Agent: ${intake.agent_name}*
`;
}

const intake = load(intakePath);

if (!intake.transfer_number) {
  console.error('ERROR: transfer_number is required in intake-form.json. Human handoff is non-negotiable.');
  process.exit(1);
}

const guide = generate(intake);

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
const outPath = path.join(outputDir, 'ghl-workflow-guide.md');
fs.writeFileSync(outPath, guide, 'utf8');

const kb = require('fs').statSync(outPath).size;
console.log(`✓ ghl-workflow-guide.md → ${outPath} (${(kb/1024).toFixed(1)} KB)`);
