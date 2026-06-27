#!/usr/bin/env node
// GHL Agent Setup Framework — Master Generator
// Usage: node generate-all.js [path/to/intake-form.json]
//
// Primary output: output/ghl-workflow-guide.md
//   A single top-to-bottom document GHL admins follow from account prep through go-live.
//   All copy-paste content is embedded inline — no other files needed during setup.
//
// Secondary outputs (reference artifacts, generated alongside):
//   output/system-prompt.txt
//   output/knowledge-base-content.md
//   output/post-call-workflow-spec.json

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const intakePath = process.argv[2] || path.join(__dirname, 'intake-form.json');
const outputDir = path.join(__dirname, 'output');

function load(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Intake form not found at ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function run(scriptName, intakePath) {
  const scriptPath = path.join(__dirname, scriptName);
  try {
    const out = execSync(`node "${scriptPath}" "${intakePath}"`, { encoding: 'utf8' });
    process.stdout.write(out);
  } catch (err) {
    console.error(`ERROR running ${scriptName}:\n${err.stderr || err.message}`);
    process.exit(1);
  }
}

function fileSizeKB(filePath) {
  return (fs.statSync(filePath).size / 1024).toFixed(1);
}

// --- Main ---

console.log('\n========================================');
console.log(' WebGuildAI — GHL Agent Setup Generator');
console.log('========================================\n');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const intake = load(intakePath);
console.log(`Client:  ${intake.business_name}`);
console.log(`Agent:   ${intake.agent_name}`);
console.log(`Input:   ${intakePath}\n`);

// Primary output — the unified workflow guide
console.log('--- Generating workflow guide ---');
run('workflow-guide-generator.js', intakePath);

// Secondary reference artifacts
console.log('\n--- Generating reference artifacts ---');
run('system-prompt-generator.js', intakePath);
run('knowledge-base-generator.js', intakePath);
run('workflow-spec-generator.js', intakePath);

// Summary
console.log('\n--- Output ---');

const primary = path.join(outputDir, 'ghl-workflow-guide.md');
console.log(`\n  PRIMARY (give this to the GHL admin):`);
console.log(`  ★ ghl-workflow-guide.md              ${fileSizeKB(primary)} KB`);

const secondary = [
  'system-prompt.txt',
  'knowledge-base-content.md',
  'post-call-workflow-spec.json',
];
console.log(`\n  SECONDARY (reference artifacts — content already embedded in the guide):`);
for (const f of secondary) {
  const p = path.join(outputDir, f);
  if (fs.existsSync(p)) {
    console.log(`    ${f.padEnd(35)} ${fileSizeKB(p)} KB`);
  }
}

console.log(`\n  Output directory: ${outputDir}/\n`);
console.log('--- Done ---');
console.log(`Hand output/ghl-workflow-guide.md to the GHL admin.`);
console.log(`They work through it top to bottom — all content is embedded inline.\n`);
