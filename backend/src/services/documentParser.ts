import pdfParse from "pdf-parse";

export interface ExtractedMedication {
  name: string;
  dosageAmount: string;
  frequency: string;
  instructions: string;
}

export interface ExtractedLabResult {
  testName: string;
  result: string;
  referenceRange: string;
}

export interface ExtractedVisit {
  visitDate: string;
  reason: string;
  doctorName: string | null;
  doctorSpecialty: string | null;
}

export type ParsedDocumentType = "prescription" | "lab_result" | "visit" | "discharge_summary" | "vaccination" | "unknown";

export interface ExtractedVaccination {
  vaccineName: string;
  date: string;
  dose?: string;
}

export interface ParsedDocument {
  type: ParsedDocumentType;
  medications: ExtractedMedication[];
  labResults: ExtractedLabResult[];
  visits: ExtractedVisit[];
  vaccinations: ExtractedVaccination[];
  rawText: string;
}

// Convert a base64 data URL or raw base64 string to a Buffer
export function dataUrlToBuffer(dataUrl: string): Buffer | null {
  try {
    let base64 = dataUrl;
    if (base64.startsWith("data:")) {
      const comma = base64.indexOf(",");
      if (comma === -1) return null;
      base64 = base64.slice(comma + 1);
    }
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text ?? "";
  } catch {
    const data = await pdfParse(buffer);
    return data.text ?? "";
  }
}

function detectType(text: string): ParsedDocumentType {
  const upper = text.toUpperCase();

  const rxKeywords = ["PRESCRIPTION", "SIG:", "PHARMACY", "REFILL", "DISPENSE", "PRESCRIB", "TABLET", "CAPSULE", "MEDICATION", "DRUG"];
  const labKeywords = ["LABORATORY", "LAB REPORT", "LAB RESULT", "REFERENCE RANGE", "SPECIMEN", "COLLECTED", "PATHOLOGY", "PANEL", "HEMATOLOGY", "CBC", "COMPLETE BLOOD", "METABOLIC", "LIPID", "RENAL", "THYROID", "GLUCOSE", "HBA1C", "CHOLESTEROL", "TRIGLYCERIDES", "HEMOGLOBIN", "HEMATOCRIT", "PLATELET", "WBC", "RBC", "TEST RESULT", "LAB TEST"];
  const visitKeywords = ["VISIT SUMMARY", "CLINIC VISIT", "OFFICE VISIT", "FOLLOW-UP", "CONSULTATION", "PATIENT VISIT", "DOCTOR VISIT", "PHYSICIAN VISIT", "OUTPATIENT VISIT", "APPOINTMENT", "CHIEF COMPLAINT", "HISTORY OF PRESENT ILLNESS", "SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN"];
  const dischargeKeywords = ["DISCHARGE SUMMARY", "DISCHARGE DIAGNOS", "ADMITTING DIAGNOS", "HOSPITAL COURSE", "LOS (LENGTH"];
  const vaccinationKeywords = ["IMMUNIZATION RECORD", "VACCINATION CERTIFICATE", "VACCINE REGISTRY", "IMMUNIZATION SERVICES", "VACCINATIONS", "IMMUNIZATIONS", "IMMUNIZATION", "VACCINE", "LOT #", "DOSE GIVEN", "DATE GIVEN", "VIS DATE", "ADMINISTERED", "TDAP", "FLUZONE", "FLUBLOK", "SHINGRIX", "PREVNAR", "PNEUMOVAX", "HEPLISAV"];

  const rxScore = rxKeywords.filter((k) => upper.includes(k)).length;
  const labScore = labKeywords.filter((k) => upper.includes(k)).length;
  const visitScore = visitKeywords.filter((k) => upper.includes(k)).length;
  const dischargeScore = dischargeKeywords.filter((k) => upper.includes(k)).length;
  const vaccinationScore = vaccinationKeywords.filter((k) => upper.includes(k)).length;

  const max = Math.max(rxScore, labScore, visitScore, dischargeScore, vaccinationScore);
  if (max === 0) return "unknown";
  if (vaccinationScore >= 3 && vaccinationScore >= rxScore && vaccinationScore >= labScore) return "vaccination";
  if (dischargeScore === max && dischargeScore > 0) return "discharge_summary";
  if (visitScore === max && visitScore > 0) return "visit";
  if (rxScore >= labScore) return rxScore > 0 ? "prescription" : "unknown";
  return labScore > 0 ? "lab_result" : "unknown";
}

// Extract drug blocks from a prescription. Relies on the "Generic" line following a drug name.
function extractMedications(text: string): ExtractedMedication[] {
  const medications: ExtractedMedication[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] ?? "";

    // Drug name lines are immediately followed by a "Generic" marker line
    const isFollowedByGeneric =
      nextLine.toLowerCase().startsWith("generic") ||
      nextLine.toLowerCase().includes("therapeutic class");

    if (!isFollowedByGeneric) continue;

    const name = line;
    if (!name || name.length > 100 || name.length < 3) continue;
    // Skip header-like lines
    if (/^(Patient|Date|MRN|Insurance|Phone|Sex|Age|Strength|Route|Frequency|Duration)/i.test(name)) continue;

    let dosageAmount = "";
    let frequency = "";
    let instructions = "";

    // Search up to 25 lines ahead for this drug's details
    for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
      const l = lines[j];

      // Dosage: starts with number and a unit
      if (!dosageAmount && /^\d+(?:\.\d+)?\s*(?:mg|mcg|g|mL|units|IU|mEq)/i.test(l)) {
        dosageAmount = l.replace(/\s+/g, " ");
      }

      // Frequency: explicit frequency keywords but not plain day-count lines
      if (
        !frequency &&
        /(?:once daily|twice daily|three times|daily|BID|TID|QID|weekly|monthly|per day|every\s+\d+)/i.test(l) &&
        !/^\d+\s+days?/i.test(l)
      ) {
        frequency = l.replace(/\s+/g, " ");
      }

      // Sig instructions
      if (!instructions && /^Take\s/i.test(l)) {
        instructions = l.replace(/\s+/g, " ");
      }

      // Stop at the start of the next drug block
      if (
        j > i + 3 &&
        (lines[j].toLowerCase().startsWith("generic") ||
          lines[j].toLowerCase().includes("therapeutic class"))
      ) {
        break;
      }
    }

    medications.push({ name, dosageAmount, frequency, instructions });
  }

  return medications;
}

// Extract individual test results from a lab report
function extractLabResults(text: string): ExtractedLabResult[] {
  const results: ExtractedLabResult[] = [];
  const seen = new Set<string>();

  const skipLine =
    /^(?:Page|Printed|Report(?:ed)?|Date|Time|Order|Patient|MRN|Account|Insurance|Physician|Lab(?:oratory)?|Tel|Fax|CLIA|Address|Test(?: Name)?|Parameter|Analyte|Component|Method|Flag|Units|Reference(?: Range)?|Result|Specimen|Collected|Clinical Indication|Creatinine Trend|Gentamicin Drug Level|Renal Function Panel|Laboratory Report)\b/i;
  const rangeRegex = /(?:\d+(?:\.\d+)?\s*(?:-|–|to)\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?|>\s*\d+(?:\.\d+)?|<\s*\d+(?:\.\d+)?)/i;

  const lines = text
    .split("\n")
    .map((line) =>
      line
        .replace(/[|]/g, " ")
        .replace(/[‐‑‒–—]/g, "-")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  const isLikelyTestName = (value: string) =>
    /^[A-Za-z][A-Za-z0-9 (),+\-/.%]{2,90}$/.test(value) &&
    !skipLine.test(value) &&
    !/^(?:H|L|N|HH|LL|TOXIC)$/i.test(value) &&
    !/^(?:mg\/dL|mcg\/mL|mEq\/L|mL\/min\/1\.73m2|g\/dL|%|mmol\/L)$/i.test(value) &&
    !/^\d/.test(value);

  const normalizeResult = (value: string) =>
    value
      .replace(/\s+(?:H|L|N|HH|LL|TOXIC)$/i, "")
      .replace(/\s+(?:mg\/dL|mcg\/mL|mEq\/L|g\/dL|mmol\/L|IU\/L)$/i, "")
      .trim();

  const isLikelyResult = (value: string) =>
    /^(?:[<>]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s+(?:H|L|N|HH|LL|TOXIC))?|Positive|Negative|Detected|Not Detected|Reactive|Nonreactive|Normal|Abnormal)$/i.test(value);

  const isLikelyUnit = (value: string) =>
    /^(?:[a-zA-Z%][a-zA-Z0-9/.\-^µμ]{0,20}|mL\/min\/1\.73m2)$/i.test(value) &&
    !rangeRegex.test(value) &&
    !isLikelyResult(value);

  const pushUnique = (testName: string, result: string, referenceRange: string) => {
    const key = testName.toLowerCase();
    if (
      testName.length < 3 ||
      testName.length > 90 ||
      seen.has(key) ||
      /^(?:Date|Test|Result|Units|Reference|Flag)$/i.test(testName)
    ) {
      return;
    }
    seen.add(key);
    results.push({ testName, result, referenceRange });
  };

  // Strategy 1: single-line lab row extraction
  for (const line of lines) {
    if (line.length > 240 || line.length < 5 || skipLine.test(line)) continue;
    if (/^[A-Z0-9 ()\-]+$/.test(line) && !/\d/.test(line)) continue;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(line)) continue;

    // Lab rows like:
    // "Creatinine, Serum 2.4 mg/dL 0.7 - 1.2 H"
    // "eGFR (CKD-EPI) 29 mL/min/1.73m2 >60 L"
    const m = line.match(
      /^([A-Za-z][A-Za-z0-9 (),+\-\/.%]{2,90}?)\s+([<>]?\d+(?:\.\d+)?(?:\/\d+)?|Positive|Negative|Detected|Not Detected|Reactive|Nonreactive|Normal|Abnormal)\s+([A-Za-z%/.\d^µμ-]+)?(?:\s+([<>]?\s*\d+(?:\.\d+)?\s*(?:-|to)\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?))?(?:\s+(H|L|N|HH|LL|TOXIC))?$/i,
    );

    if (!m) continue;

    const testName = m[1].replace(/\*+\s*$/, "").trim();
    const result = normalizeResult(m[2].trim());
    const explicitRange = m[4]?.trim() || "";
    const inferredRange = explicitRange || line.match(rangeRegex)?.[0]?.trim() || "";

    pushUnique(testName, result, inferredRange);
  }

  // Strategy 2: multiline table extraction where PDF breaks columns into lines
  for (let i = 0; i < lines.length; i++) {
    const candidateName = lines[i];
    if (!isLikelyTestName(candidateName)) continue;

    let candidateResult = "";
    let candidateRange = "";

    for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
      const v = lines[j];
      if (!candidateResult && isLikelyResult(v)) {
        candidateResult = normalizeResult(v);
        continue;
      }
      if (!candidateRange && rangeRegex.test(v)) {
        candidateRange = (v.match(rangeRegex)?.[0] || "").trim();
        continue;
      }
      if (isLikelyUnit(v)) {
        continue;
      }
      if (isLikelyTestName(v) && j > i + 1) {
        break;
      }
    }

    if (candidateResult) {
      pushUnique(candidateName.replace(/\*+\s*$/, "").trim(), candidateResult, candidateRange);
    }
  }

  // Strategy 3: token-stream fallback for reports where each table cell becomes its own line.
  if (results.length === 0) {
    const knownTests = [
      "Creatinine, Serum",
      "Creatinine",
      "BUN",
      "eGFR (CKD-EPI)",
      "eGFR",
      "Uric Acid",
      "Phosphorus",
      "Magnesium",
      "Potassium (K+)",
      "Potassium",
      "Sodium (Na+)",
      "Sodium",
      "Gentamicin Trough Level",
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matchedTest = knownTests.find((test) => line.toLowerCase() === test.toLowerCase());
      if (!matchedTest) continue;

      let candidateResult = "";
      let candidateRange = "";
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const token = lines[j];
        if (!candidateResult && isLikelyResult(token)) {
          candidateResult = normalizeResult(token);
          continue;
        }
        if (!candidateRange && rangeRegex.test(token)) {
          candidateRange = (token.match(rangeRegex)?.[0] || "").trim();
          continue;
        }
      }

      if (candidateResult) {
        pushUnique(matchedTest, candidateResult, candidateRange);
      }
    }
  }

  // Strategy 4: full-text regex extraction for compact/flattened PDF text streams.
  if (results.length === 0) {
    const collapsed = text
      .replace(/[‐‑‒–—]/g, "-")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const regexConfigs: Array<{ testName: string; pattern: RegExp }> = [
      { testName: "Creatinine, Serum", pattern: /Creatinine,\s*Serum\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?)/i },
      { testName: "BUN", pattern: /\bBUN\b\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?)/i },
      { testName: "eGFR (CKD-EPI)", pattern: /eGFR\s*\(CKD-EPI\)\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+([<>]\s*\d+(?:\.\d+)?)/i },
      { testName: "Uric Acid", pattern: /Uric\s+Acid\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?)/i },
      { testName: "Phosphorus", pattern: /Phosphorus\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?)/i },
      { testName: "Magnesium", pattern: /Magnesium\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?)/i },
      { testName: "Potassium (K+)", pattern: /Potassium\s*\(K\+\)\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?)/i },
      { testName: "Sodium (Na+)", pattern: /Sodium\s*\(Na\+\)\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?)/i },
      { testName: "Gentamicin Trough Level", pattern: /Gentamicin\s+Trough\s+Level\s+([<>]?\d+(?:\.\d+)?)(?:\s+[A-Za-z/%.\d^-]+)?\s+([<>]\s*\d+(?:\.\d+)?)/i },
    ];

    for (const config of regexConfigs) {
      const match = collapsed.match(config.pattern);
      if (!match) continue;
      const resultValue = normalizeResult((match[1] || "").trim());
      const rangeValue = (match[2] || "").trim();
      if (!resultValue) continue;
      pushUnique(config.testName, resultValue, rangeValue);
    }
  }

  // Strategy 5: compact row parsing for PDFs where columns are merged
  // e.g. "Creatinine, Serum2.4mg/dL0.7 - 1.2H"
  if (results.length === 0) {
    const compact = text
      .replace(/[‐‑‒–—]/g, "-")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, "")
      .trim();

    const compactConfigs: Array<{ testName: string; pattern: RegExp }> = [
      { testName: "Creatinine, Serum", pattern: /Creatinine,Serum([<>]?\d+(?:\.\d+)?)mg\/dL(\d+(?:\.\d+)?-\d+(?:\.\d+)?|[<>]\d+(?:\.\d+)?)(?:H|L|N|HH|LL)?/i },
      { testName: "BUN", pattern: /\bBUN([<>]?\d+(?:\.\d+)?)mg\/dL(\d+(?:\.\d+)?-\d+(?:\.\d+)?|[<>]\d+(?:\.\d+)?)(?:H|L|N|HH|LL)?/i },
      { testName: "eGFR (CKD-EPI)", pattern: /eGFR\(CKD-EPI\)([<>]?\d+(?:\.\d+)?)mL\/min\/1\.73m(?:²|2)([<>]\d+(?:\.\d+)?)(?:H|L|N|HH|LL)?/i },
      { testName: "Uric Acid", pattern: /UricAcid([<>]?\d+(?:\.\d+)?)mg\/dL(\d+(?:\.\d+)?-\d+(?:\.\d+)?|[<>]\d+(?:\.\d+)?)(?:H|L|N|HH|LL)?/i },
      { testName: "Phosphorus", pattern: /Phosphorus([<>]?\d+(?:\.\d+)?)mg\/dL(\d+(?:\.\d+)?-\d+(?:\.\d+)?|[<>]\d+(?:\.\d+)?)(?:H|L|N|HH|LL)?/i },
      { testName: "Magnesium", pattern: /Magnesium([<>]?\d+(?:\.\d+)?)mg\/dL(\d+(?:\.\d+)?-\d+(?:\.\d+)?|[<>]\d+(?:\.\d+)?)(?:H|L|N|HH|LL)?/i },
      { testName: "Potassium (K+)", pattern: /Potassium\(K\+\)([<>]?\d+(?:\.\d+)?)mEq\/L(\d+(?:\.\d+)?-\d+(?:\.\d+)?|[<>]\d+(?:\.\d+)?)(?:H|L|N|HH|LL)?/i },
      { testName: "Sodium (Na+)", pattern: /Sodium\(Na\+\)([<>]?\d+(?:\.\d+)?)mEq\/L(\d+(?:\.\d+)?-\d+(?:\.\d+)?|[<>]\d+(?:\.\d+)?)(?:H|L|N|HH|LL)?/i },
      { testName: "Gentamicin Trough Level", pattern: /GentamicinTroughLevel([<>]?\d+(?:\.\d+)?)mcg\/mL([<>]\d+(?:\.\d+)?(?:mcg\/mL)?)(?:TOXIC|H|L|N)?/i },
    ];

    for (const config of compactConfigs) {
      const match = compact.match(config.pattern);
      if (!match) continue;
      const resultValue = normalizeResult((match[1] || "").trim());
      const rangeValue = (match[2] || "").trim();
      if (!resultValue) continue;
      pushUnique(config.testName, resultValue, rangeValue);
    }
  }

  return results;
}

function extractVaccinations(text: string): ExtractedVaccination[] {
  const vaccinations: ExtractedVaccination[] = [];
  const seen = new Set<string>();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;

  const vaccinePatterns = [
    /mRNA COVID[^\n]{0,40}/i,
    /COVID-19[^\n]{0,40}/i,
    /High-Dose Fluzone[^\n]{0,30}/i,
    /Fluzone[^\n]{0,30}/i,
    /Flublok[^\n]{0,30}/i,
    /Flucelvax[^\n]{0,30}/i,
    /Influenza[^\n]{0,30}/i,
    /Tdap[^\n]{0,30}/i,
    /DTaP[^\n]{0,30}/i,
    /Shingrix[^\n]{0,30}/i,
    /Zoster[^\n]{0,30}/i,
    /Pneumovax[^\n]{0,20}/i,
    /Prevnar[^\n]{0,20}/i,
    /PCV\d{0,2}[^\n]{0,20}/i,
    /PPSV\d{0,2}[^\n]{0,20}/i,
    /Hepatitis [AB][^\n]{0,30}/i,
    /Heplisav[^\n]{0,20}/i,
    /RSV Vaccine[^\n]{0,30}/i,
    /Abrysvo[^\n]{0,20}/i,
    /Varicella[^\n]{0,20}/i,
    /MMR[^\n]{0,10}/i,
    /HPV[^\n]{0,10}/i,
    /Gardasil[^\n]{0,20}/i,
    /Meningococcal[^\n]{0,30}/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    let vaccineName = "";
    for (const pattern of vaccinePatterns) {
      const m = line.match(pattern);
      if (m) {
        vaccineName = m[0].replace(/[–—]\s*$/, "").trim();
        break;
      }
    }
    if (!vaccineName || vaccineName.length < 3) continue;

    // Find date in this and the next 5 lines
    let dateStr = "";
    for (let j = i; j < Math.min(i + 6, lines.length); j++) {
      const dm = lines[j].match(datePattern);
      if (dm) { dateStr = dm[0]; break; }
    }
    if (!dateStr) continue;

    const key = `${vaccineName.toLowerCase()}-${dateStr}`;
    if (seen.has(key)) continue;
    seen.add(key);
    vaccinations.push({ vaccineName, date: dateStr });
  }

  return vaccinations;
}

// Extract visit information from a visit summary
function extractVisits(text: string): ExtractedVisit[] {
  const visits: ExtractedVisit[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  console.log("[extractVisits] Starting visit extraction, lines:", lines.length);

  let visitDate: string | null = null;
  let reason: string | null = null;
  let doctorName: string | null = null;
  let doctorSpecialty: string | null = null;

  // Date patterns
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract date
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match && !visitDate) {
        visitDate = match[0];
        console.log("[extractVisits] Found date:", visitDate);
        break;
      }
    }

    // Extract reason/chief complaint
    if (!reason && (line.toLowerCase().includes("chief complaint") || line.toLowerCase().includes("reason for visit") || line.toLowerCase().includes("reason:"))) {
      const nextLine = lines[i + 1] || "";
      if (nextLine && nextLine.length > 3 && nextLine.length < 200) {
        reason = nextLine;
        console.log("[extractVisits] Found reason:", reason);
      }
    }

    // Extract doctor name
    if (!doctorName && (line.toLowerCase().includes("doctor") || line.toLowerCase().includes("physician") || line.toLowerCase().includes("provider") || line.toLowerCase().includes("attending"))) {
      const nextLine = lines[i + 1] || "";
      if (nextLine && nextLine.length > 3 && nextLine.length < 100 && /^[A-Za-z\s,\.]+$/.test(nextLine)) {
        doctorName = nextLine;
        console.log("[extractVisits] Found doctor:", doctorName);
      }
    }

    // Extract specialty
    if (!doctorSpecialty && (line.toLowerCase().includes("specialty") || line.toLowerCase().includes("department"))) {
      const nextLine = lines[i + 1] || "";
      if (nextLine && nextLine.length > 3 && nextLine.length < 100) {
        doctorSpecialty = nextLine;
        console.log("[extractVisits] Found specialty:", doctorSpecialty);
      }
    }

    // If we have enough info, create a visit
    if (visitDate && (reason || doctorName)) {
      visits.push({
        visitDate,
        reason: reason || "General visit",
        doctorName,
        doctorSpecialty,
      });
      console.log("[extractVisits] Created visit:", { visitDate, reason, doctorName, doctorSpecialty });
      // Reset for next visit
      visitDate = null;
      reason = null;
      doctorName = null;
      doctorSpecialty = null;
    }
  }

  // Fallback: if no structured visit found but document type is visit, create one with available info
  if (visits.length === 0 && visitDate) {
    visits.push({
      visitDate,
      reason: reason || "General visit",
      doctorName,
      doctorSpecialty,
    });
    console.log("[extractVisits] Fallback visit created");
  }

  console.log("[extractVisits] Total visits extracted:", visits.length);
  return visits;
}

export async function parseUploadedDocument(
  fileContent: string,
  mimeType?: string | null,
): Promise<ParsedDocument> {
  const empty: ParsedDocument = { type: "unknown", medications: [], labResults: [], visits: [], vaccinations: [], rawText: "" };

  const isPdf =
    mimeType?.includes("pdf") ||
    fileContent.startsWith("data:application/pdf") ||
    fileContent.startsWith("data:application/octet-stream");

  if (!isPdf) return empty;

  const buffer = dataUrlToBuffer(fileContent);
  if (!buffer) return empty;

  let rawText: string;
  try {
    rawText = await extractPdfText(buffer);
  } catch {
    return empty;
  }

  if (!rawText || rawText.trim().length < 50) return empty;

  const type = detectType(rawText);
  const medications = type === "prescription" ? extractMedications(rawText) : [];
  const labResults = type === "lab_result" ? extractLabResults(rawText) : [];
  const visits = type === "visit" ? extractVisits(rawText) : [];
  const vaccinations = type === "vaccination" ? extractVaccinations(rawText) : [];

  return { type, medications, labResults, visits, vaccinations, rawText };
}
