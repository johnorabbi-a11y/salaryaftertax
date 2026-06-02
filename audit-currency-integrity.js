const fs = require("fs");
const path = require("path");

const root = process.argv[2] || process.cwd();
process.chdir(root);

const files = fs.readdirSync(".").filter((file) => file.endsWith(".html"));
const findings = [];

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function addFindings(file, patternName, text, regex) {
  let match;
  while ((match = regex.exec(text))) {
    findings.push({
      file,
      line: lineNumber(text, match.index),
      pattern: patternName,
      match: match[0],
      context: text.slice(Math.max(0, match.index - 45), match.index + 80).replace(/\s+/g, " ").trim(),
    });
  }
}

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const visible = raw.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Visible text only, to avoid false positives from JavaScript ternary operators.
  addFindings(file, "question-mark-before-comma-currency", visible, /\?\s?\d{1,3},\d{3}(?=\b|\s|<|&)/g);
  addFindings(file, "question-mark-before-common-uk-salary", visible, /\?(?:20|30|40|50|60|70|80|90|100|120|150|200),000/g);

  // Whole document checks for encoding artefacts.
  addFindings(file, "replacement-character", raw, /\uFFFD/g);
  addFindings(file, "latin1-pound-mojibake", raw, /\u00C2\u00A3/g);
}

console.log("Currency Integrity Audit");
console.log("========================");
console.log(`HTML files scanned: ${files.length}`);
console.log(`Findings: ${findings.length}`);

if (findings.length) {
  console.log("\nFailures:");
  for (const finding of findings) {
    console.log(`FAIL ${finding.file}:${finding.line}`);
    console.log(`  - ${finding.pattern}: ${finding.match}`);
    console.log(`  - ${finding.context}`);
  }
  process.exit(1);
}

console.log("\nPASS: no suspicious visible currency encoding patterns found.");
