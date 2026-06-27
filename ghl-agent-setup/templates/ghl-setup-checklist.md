# GHL Inbound Voice AI Agent — Setup Checklist
## Client: {{BUSINESS_NAME}} | Agent: {{AGENT_NAME}}

> **⚠️ MANUAL SETUP REQUIRED:** GHL does not expose public API write endpoints for AI Agent configuration. All 7 phases below require hands-on GHL UI work. Use the generated artifacts from `output/` as copy-paste sources.

---

## Phase 1: Sub-Account Preparation

- [ ] Confirm you are working inside the correct **sub-account** for {{BUSINESS_NAME}} — not the Agency account
- [ ] Navigate to: **Sub-Account > Settings > Business Info**
  - [ ] Verify business name, address, and time zone are correct
  - [ ] **Time zone must match** the calendar time zone and agent time zone — mismatches cause appointment booking failures
- [ ] Navigate to: **Sub-Account > Settings > Phone Numbers**
  - [ ] Confirm an inbound phone number is assigned to this sub-account
  - [ ] **⚠️ PHONE PRICING:** If purchasing a new number, confirm country: `{{PHONE_COUNTRY}}`
    - US numbers: ~$0.15/month
    - Philippine (PH) numbers: $15–$120+/month — verify with client before purchase
  - [ ] **⚠️ A2P 10DLC:** If SMS automation will be used, the sending number must be A2P 10DLC registered BEFORE going live
    - Navigate to: **Sub-Account > Settings > Phone Numbers > A2P Registration**
    - Non-approved numbers fail silently — the workflow runs but SMS is never delivered

---

## Phase 2: Agent Creation (Advanced Mode)

> **⚠️ NEVER use Basic Mode.** Basic Mode lacks the control needed for production deployments. If GHL defaults to Basic Mode, switch to Advanced Mode before pasting the system prompt.

- [ ] Navigate to: **Sub-Account > AI Agents > Voice AI > Inbound > + Create Agent**
- [ ] Set Agent Name: `{{AGENT_NAME}}`
- [ ] Set Agent Type: **Inbound**
- [ ] Switch to **Advanced Mode** (toggle at top of agent config)
- [ ] Paste the contents of `output/system-prompt.txt` into the System Prompt field
  - [ ] Verify word count is under 2,000 (the generator reports this — check terminal output)
- [ ] Set the agent's **time zone** to match the sub-account time zone ({{TIMEZONE}})
- [ ] **⚠️ CONTACT NAME BUG:** Verify the system prompt instructs the agent to collect the caller's full name as the FIRST data point. If not, the contact record will default to the sub-account admin name. The generated system prompt handles this — do not remove the name collection step.
- [ ] Save the agent

---

## Phase 3: Knowledge Base

- [ ] Navigate to: **Sub-Account > AI Agents > Knowledge Base > + New**
- [ ] Create a new Knowledge Base named: `{{BUSINESS_NAME}} — Agent KB`
- [ ] Copy the contents of `output/knowledge-base-content.md` and paste into the Knowledge Base editor
- [ ] Save the Knowledge Base
- [ ] Attach the Knowledge Base to the `{{AGENT_NAME}}` agent:
  - Navigate back to the agent config > Knowledge Base tab > select `{{BUSINESS_NAME}} — Agent KB`
- [ ] **⚠️ PROPAGATION DELAY:** After saving the Knowledge Base, wait **1–2 minutes** before testing. Knowledge Base content is not instantly available to the agent. Running tests immediately after save will produce incorrect results.

---

## Phase 4: Actions Setup

> Each action maps to a capability the agent invokes during a call. All three are required for production.

### 4a. Call Transfer Action
- [ ] In the agent config, navigate to: **Actions > + Add Action > Call Transfer**
- [ ] Set transfer number: `{{TRANSFER_NUMBER}}`
- [ ] Name the action: `Transfer to Live Agent`
- [ ] Save

### 4b. Appointment Booking Action
- [ ] Navigate to: **Actions > + Add Action > Appointment Booking**
- [ ] Select calendar: `{{CALENDAR_NAME}}` (Calendar ID: `{{CALENDAR_ID}}`)
- [ ] Name the action: `Book Appointment`
- [ ] Confirm the calendar time zone matches the sub-account time zone — **time zone mismatch is the #1 booking failure point**
- [ ] Save

### 4c. Workflow Trigger Action (Emergency)
- [ ] Navigate to: **Actions > + Add Action > Workflow Trigger**
- [ ] Select workflow: `{{BUSINESS_NAME}} — Emergency Call Handler` (create this workflow first if not exists)
- [ ] Name the action: `Emergency Escalation`
- [ ] Save

---

## Phase 5: Calendar Configuration

- [ ] Navigate to: **Sub-Account > Calendars > {{CALENDAR_NAME}}**
- [ ] Confirm calendar type: **Personal Booking** (or per-technician if multiple)
- [ ] Confirm appointment duration: `{{APPOINTMENT_DURATION}} minutes`
- [ ] Confirm available slots match `{{BUSINESS_NAME}}` operating hours
- [ ] **⚠️ TIME ZONE TRIPLE-CHECK:**
  - Sub-account time zone: ____________________
  - Calendar time zone: ____________________
  - Agent time zone: ____________________
  - All three must match. If they differ, appointments will be booked at the wrong time.
- [ ] Confirm the calendar is connected to the correct technician(s)
- [ ] Set buffer time between appointments if needed (recommended: 15 min)
- [ ] Save calendar settings

---

## Phase 6: Post-Call Automation Workflow

> Use `output/post-call-workflow-spec.json` as the blueprint. Manual setup required in GHL UI.

- [ ] Navigate to: **Sub-Account > Automation > Workflows > + New Workflow**
- [ ] Name: `{{BUSINESS_NAME}} — Post-Call AI Booking Automation`
- [ ] Add trigger: **Appointment Booked by AI Agent**
  - Filter by calendar: `{{CALENDAR_NAME}}`
- [ ] Add action: **Wait** — 5 seconds
- [ ] Add action: **Send SMS**
  - To: Contact ({{PHONE_FIELD}})
  - From: Assigned number (confirm A2P approved)
  - Template: copy from `post-call-workflow-spec.json` > actions[1].template
  - **⚠️ A2P WARNING:** Do not activate this step until the sending number has A2P 10DLC approval
- [ ] Add action: **Send Email**
  - To: `{{TECHNICIAN_EMAIL}}`
  - Subject/Body: copy from `post-call-workflow-spec.json` > actions[2]
- [ ] Add action: **Add Tag** — `Booked by AI`
- [ ] Add action: **Add Tag** — `AI - {{INDUSTRY}}`
- [ ] Set workflow status to **Published**
- [ ] Save

---

## Phase 7: Phone Number Assignment

- [ ] Navigate to: **Sub-Account > AI Agents > Voice AI > Inbound > {{AGENT_NAME}}**
- [ ] Assign the inbound phone number to this agent
- [ ] Confirm the number is not already assigned to another agent or call routing rule
- [ ] Save

---

## Final Pre-Launch Verification

- [ ] All 3 agent actions are configured: Transfer, Appointment Booking, Emergency Workflow
- [ ] System prompt word count < 2,000
- [ ] Knowledge Base saved and at least 2 minutes have passed since last edit
- [ ] Calendar time zone = Agent time zone = Sub-account time zone
- [ ] A2P 10DLC approved on sending number (if SMS workflow is active)
- [ ] Technician email in workflow is correct: `{{TECHNICIAN_EMAIL}}`
- [ ] Phone number assigned to agent and not double-assigned
- [ ] Test checklist completed (see `output/test-checklist.md`)

---

*Generated by WebGuildAI GHL Agent Setup Framework*
*Generated: {{GENERATED_DATE}}*
