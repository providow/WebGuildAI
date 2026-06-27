#!/usr/bin/env node
// Master orchestrator — generates all GHL agent setup artifacts from intake-form.json
// Usage: node generate-all.js [path/to/intake-form.json]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const intakePath = process.argv[2] || path.join(__dirname, 'intake-form.json');
const outputDir = path.join(__dirname, 'output');
const templatesDir = path.join(__dirname, 'templates');

function load(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Intake form not found at ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function renderTemplate(templatePath, tokens) {
  let content = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(tokens)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  return content;
}

function formatHoursInline(hours) {
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  return days.map(d => {
    const h = hours[d];
    if (!h || h.open === 'closed') return null;
    return `${d.charAt(0).toUpperCase() + d.slice(1)} ${h.open}–${h.close}`;
  }).filter(Boolean).join(', ');
}

function runScript(scriptName, intakePath) {
  const scriptPath = path.join(__dirname, scriptName);
  try {
    const output = execSync(`node "${scriptPath}" "${intakePath}"`, { encoding: 'utf8' });
    process.stdout.write(output);
  } catch (err) {
    console.error(`ERROR running ${scriptName}:\n${err.stderr || err.message}`);
    process.exit(1);
  }
}

function fileSizeKB(filePath) {
  const bytes = fs.statSync(filePath).size;
  return (bytes / 1024).toFixed(1);
}

// --- Main ---

console.log('\n========================================');
console.log(' WebGuildAI — GHL Agent Setup Generator');
console.log('========================================\n');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const intake = load(intakePath);
console.log(`Client: ${intake.business_name}`);
console.log(`Agent:  ${intake.agent_name}`);
console.log(`Input:  ${intakePath}\n`);

// Run the 3 generator scripts
console.log('--- Generating scripts ---');
runScript('system-prompt-generator.js', intakePath);
runScript('knowledge-base-generator.js', intakePath);
runScript('workflow-spec-generator.js', intakePath);

// Render parameterized templates
console.log('\n--- Rendering templates ---');
const tokens = {
  BUSINESS_NAME: intake.business_name,
  AGENT_NAME: intake.agent_name,
  TECHNICIAN_EMAIL: intake.technician_email,
  PHONE_COUNTRY: intake.phone_number_country,
  TRANSFER_NUMBER: intake.transfer_number || 'NOT SET — REQUIRED',
  CALENDAR_NAME: intake.calendar_id ? `Calendar (${intake.calendar_id})` : 'YOUR_CALENDAR_NAME',
  CALENDAR_ID: intake.calendar_id || 'YOUR_GHL_CALENDAR_ID_HERE',
  TIMEZONE: intake.operating_hours.timezone,
  APPOINTMENT_DURATION: String(intake.appointment_duration_minutes || 60),
  INDUSTRY: intake.industry,
  ZIP_CODES: intake.service_areas.zip_codes.join(', '),
  SERVICE_CITIES: intake.service_areas.cities.join(', '),
  PHONE_FIELD: '{{contact.phone}}',
  GENERATED_DATE: new Date().toISOString().split('T')[0],
};

const checklistOut = path.join(outputDir, 'ghl-setup-checklist.md');
fs.writeFileSync(checklistOut, renderTemplate(path.join(templatesDir, 'ghl-setup-checklist.md'), tokens), 'utf8');
console.log(`✓ ghl-setup-checklist.md → ${checklistOut}`);

const testOut = path.join(outputDir, 'test-checklist.md');
fs.writeFileSync(testOut, renderTemplate(path.join(templatesDir, 'test-checklist.md'), tokens), 'utf8');
console.log(`✓ test-checklist.md → ${testOut}`);

// Summary
console.log('\n--- Output Summary ---');
const outputFiles = [
  'system-prompt.txt',
  'knowledge-base-content.md',
  'post-call-workflow-spec.json',
  'ghl-setup-checklist.md',
  'test-checklist.md',
];

let allPresent = true;
for (const file of outputFiles) {
  const filePath = path.join(outputDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file.padEnd(35)} ${fileSizeKB(filePath)} KB`);
  } else {
    console.log(`  ✗ ${file} — MISSING`);
    allPresent = false;
  }
}

console.log('\n--- Next Steps ---');
console.log('1. Review output/system-prompt.txt — paste into GHL Agent > Advanced Mode');
console.log('2. Review output/knowledge-base-content.md — paste into GHL Knowledge Base');
console.log('3. Review output/post-call-workflow-spec.json — build workflow manually in GHL Automations');
console.log('4. Follow output/ghl-setup-checklist.md phase by phase');
console.log('5. Complete output/test-checklist.md before going live');
console.log('\nSee ghl-agent-setup/README.md for full usage guide and multi-client scaling notes.\n');

if (!allPresent) {
  console.error('ERROR: One or more output files are missing. Check errors above.');
  process.exit(1);
}

console.log('All artifacts generated successfully. ✓\n');
