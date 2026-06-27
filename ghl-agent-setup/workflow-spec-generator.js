#!/usr/bin/env node
// Generates post-call-workflow-spec.json from intake-form.json
// Output: output/post-call-workflow-spec.json

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

function generate(intake) {
  return {
    _warnings: [
      "⚠️  A2P 10DLC REQUIRED: The phone number sending SMS messages must be registered and approved for A2P 10DLC before this workflow will deliver messages. Non-approved numbers fail silently — the workflow appears to run but SMS is never delivered. Register at: Sub-Account > Settings > Phone Numbers > A2P Registration.",
      "⚠️  MANUAL SETUP REQUIRED: GHL does not expose a public API write endpoint for Workflow creation. Import this spec manually in GHL UI: Sub-Account > Automation > Workflows > + New Workflow.",
      `⚠️  PHONE PRICING NOTE: intake-form.json sets phone_number_country = '${intake.phone_number_country}'. US numbers cost ~$0.15/month. Philippine (PH) numbers cost $15–$120+/month. Confirm the sending number country before purchasing.`
    ],
    workflow_name: `${intake.business_name} — Post-Call AI Booking Automation`,
    trigger: {
      type: "Appointment Booked by AI Agent",
      filter: {
        calendar_id: intake.calendar_id || "YOUR_GHL_CALENDAR_ID_HERE",
        agent_name: intake.agent_name
      }
    },
    actions: [
      {
        step: 1,
        type: "Wait",
        duration_seconds: 5,
        note: "Brief delay to ensure contact record is fully written before downstream actions read from it."
      },
      {
        step: 2,
        type: "SMS",
        to: "contact",
        from: "assigned_number",
        template: `Hi {{contact.first_name}}, this is ${intake.business_name} confirming your appointment on {{appointment.start_date_time}} at {{contact.address1}}. Your technician will contact you 30 minutes before arrival. Questions? Call us at {{location.phone}}. Reply STOP to opt out.`,
        note: "Uses GHL merge fields. Ensure contact record has first_name, address1, and appointment data populated before this step runs."
      },
      {
        step: 3,
        type: "Email",
        to: intake.technician_email,
        subject: `New AI Booking — {{contact.full_name}} | {{appointment.start_date_time}}`,
        body: `A new appointment was booked by the AI agent.\n\nCustomer: {{contact.full_name}}\nPhone: {{contact.phone}}\nEmail: {{contact.email}}\nAddress: {{contact.address1}}, {{contact.city}}, {{contact.state}} {{contact.postal_code}}\nService: {{appointment.title}}\nDate/Time: {{appointment.start_date_time}}\nCalendar: {{appointment.calendar_name}}\n\nBooked via: ${intake.agent_name} Voice AI Agent\nSub-Account: ${intake.business_name}`,
        note: "Sends dispatch notification to technician team. Update technician_email in intake-form.json per client."
      },
      {
        step: 4,
        type: "Tag",
        tag: "Booked by AI",
        note: "Allows filtering AI-booked contacts in GHL Smart Lists and reporting."
      },
      {
        step: 5,
        type: "Tag",
        tag: `AI - ${intake.industry}`,
        note: "Industry-specific tag for multi-client agency reporting and Snapshot filtering."
      }
    ],
    notes: [
      "Trigger: 'Appointment Booked by AI Agent' fires after the AI agent successfully completes the GHL Appointment Booking action.",
      "The SMS step requires A2P 10DLC approval on the sending number — see _warnings above.",
      "Test this workflow using GHL Web Call before going live. Verify the contact record shows the correct name (not the sub-account admin name) after the test call.",
      "For emergency calls that do not result in a standard booking, create a separate workflow triggered by the 'Emergency' custom tag applied by the AI agent's Emergency Workflow action."
    ]
  };
}

const intake = load(intakePath);
const spec = generate(intake);

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
const outPath = path.join(outputDir, 'post-call-workflow-spec.json');
fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
console.log(`✓ post-call-workflow-spec.json → ${outPath}`);
