# GHL Voice AI Agent — End-to-End Test Checklist
## Client: {{BUSINESS_NAME}} | Agent: {{AGENT_NAME}}

---

## Pre-Test Setup

- [ ] All 7 setup phases in `ghl-setup-checklist.md` are complete
- [ ] Agent status is set to **Active** in GHL
- [ ] **⚠️ KNOWLEDGE BASE PROPAGATION:** Confirm at least **1–2 minutes** have passed since the last Knowledge Base save. Testing immediately after save will produce unreliable results — the agent may not yet have access to the updated content.
- [ ] Open GHL in one browser tab; open the **Conversations** view in a second tab to monitor real-time contact creation
- [ ] Have a test email address ready that is NOT `{{TECHNICIAN_EMAIL}}` — use it as the caller's email to avoid polluting the dispatch inbox
- [ ] Navigate to: **Sub-Account > AI Agents > Voice AI > Inbound > {{AGENT_NAME}} > Test Agent (Web Call)**

---

## Scenario 1: Normal Booking Flow ✅

**Goal:** Agent collects all data, confirms service area, books appointment, triggers post-call workflow.

**Test script:**
> "Hi, I need my AC looked at — it's not cooling."

Expected agent behavior:
- [ ] Agent greets caller as `{{AGENT_NAME}}` from `{{BUSINESS_NAME}}`
- [ ] Agent asks for **full name first** (not phone, not address)
- [ ] Agent collects: name → phone → address → email → service type → preferred time
- [ ] Agent confirms address is within service area (use a ZIP from `{{ZIP_CODES}}`)
- [ ] Agent offers 2–3 appointment slots within operating hours
- [ ] Agent books the appointment using the Appointment Booking action
- [ ] Agent provides verbal confirmation with date, time, and address

Post-call validation:
- [ ] Navigate to **Contacts** — confirm a new contact was created
- [ ] **⚠️ CONTACT NAME BUG CHECK:** Confirm the contact's name is the name you gave (not the sub-account admin name). If it shows the admin name, the system prompt is missing the name collection instruction — fix before going live.
- [ ] Confirm appointment appears in the `{{CALENDAR_NAME}}` calendar at the correct time
- [ ] **TIME ZONE VALIDATION:** Confirm the appointment time matches what was verbally confirmed during the call — time zone mismatch will show a different time
- [ ] Confirm contact has tag: `Booked by AI`
- [ ] Confirm SMS was sent to test phone number (check Conversations)
- [ ] Confirm email was delivered to `{{TECHNICIAN_EMAIL}}`

---

## Scenario 2: Out-of-Area Caller Rejection ❌

**Goal:** Agent correctly identifies an out-of-area caller and declines to book.

**Test script:**
> "Hi, I'm in [CITY OUTSIDE SERVICE AREA] — can you come out to look at my furnace?"

Use a city NOT in: `{{SERVICE_CITIES}}`

Expected agent behavior:
- [ ] Agent identifies the address is outside the service area
- [ ] Agent politely declines to book: references covered cities without quoting a competitor
- [ ] Agent does NOT proceed to collect appointment details
- [ ] Agent offers a helpful close ("I'd recommend searching for a local provider in your area")
- [ ] Call ends cleanly — no appointment created

Post-call validation:
- [ ] Confirm NO appointment was created in the calendar
- [ ] Confirm NO spurious contact tag was applied
- [ ] If a contact was created, confirm it is not tagged `Booked by AI`

---

## Scenario 3: Human Handoff Request 🔄

**Goal:** Agent transfers the call to a live agent without friction.

**Test script:**
> "I'd like to speak with a real person please."

Expected agent behavior:
- [ ] Agent acknowledges the request immediately (does not argue or offer alternatives first)
- [ ] Agent says: "I'm going to connect you with one of our team members right now. Please hold."
- [ ] Agent triggers the Call Transfer action to `{{TRANSFER_NUMBER}}`

Post-call validation:
- [ ] Confirm the call was transferred (check call logs in GHL or verify the transfer number received the call)
- [ ] Confirm agent did not continue trying to book after the transfer request

**Also test implicit handoff triggers:**
- [ ] Repeat the same question 3 times → agent should offer transfer
- [ ] Express frustration: "This isn't working, I need help" → agent should offer transfer

---

## Scenario 4: Emergency Call Handling 🚨

**Goal:** Agent handles an emergency correctly — captures info fast, escalates, does not stall.

**Test script:**
> "My heat is completely out and it's below freezing outside — I have kids at home."

Expected agent behavior:
- [ ] Agent acknowledges urgency immediately — no delay to collect non-essential info
- [ ] Agent collects name + address + callback number in rapid succession
- [ ] If during business hours: transfers to `{{TRANSFER_NUMBER}}`
- [ ] If after hours: informs caller that on-call technician will contact within 30 minutes
- [ ] Agent triggers Emergency Workflow action

Post-call validation:
- [ ] Confirm contact record created with emergency context
- [ ] If after hours: confirm emergency workflow fired (check workflow execution log)
- [ ] Confirm caller was not left on hold or asked for non-urgent information before escalation

---

## Scenario 5: FAQ / Knowledge Base Query 📚

**Goal:** Agent correctly answers questions from the Knowledge Base.

**Test questions:**
- [ ] "Do you offer financing?" → agent should reference financing policy from KB
- [ ] "Are your technicians licensed?" → agent should confirm NATE-certified and insured
- [ ] "What brands do you work on?" → agent should name brands from KB
- [ ] "How much does a diagnostic cost?" → agent should quote $89 (not fabricate a different price)

Post-call validation:
- [ ] All answers match the Knowledge Base content exactly
- [ ] Agent does not fabricate pricing or guarantees not in the KB
- [ ] If agent gives wrong answers: wait another 60 seconds for KB propagation and retest

---

## Sign-Off

| Test Scenario | Pass / Fail | Notes |
|---|---|---|
| 1. Normal Booking | | |
| 2. Out-of-Area Rejection | | |
| 3. Human Handoff | | |
| 4. Emergency Handling | | |
| 5. FAQ / KB Queries | | |

- [ ] All 5 scenarios passed
- [ ] Contact name bug confirmed NOT present
- [ ] Time zone confirmed correct on all booked appointments
- [ ] SMS and email confirmed delivered
- [ ] Agent is approved for live inbound calls

**Tester:** _______________________ **Date:** _______________________

---

*Generated by WebGuildAI GHL Agent Setup Framework*
*Generated: {{GENERATED_DATE}}*
