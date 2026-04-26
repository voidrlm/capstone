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

export type ParsedDocumentType = "prescription" | "lab_result" | "discharge_summary" | "unknown";

export interface ParsedDocument {
  type: ParsedDocumentType;
  medications: ExtractedMedication[];
  labResults: ExtractedLabResult[];
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
  const dischargeKeywords = ["DISCHARGE SUMMARY", "DISCHARGE DIAGNOS", "ADMITTING DIAGNOS", "HOSPITAL COURSE", "LOS (LENGTH"];

  const rxScore = rxKeywords.filter((k) => upper.includes(k)).length;
  const labScore = labKeywords.filter((k) => upper.includes(k)).length;
  const dischargeScore = dischargeKeywords.filter((k) => upper.includes(k)).length;

  const max = Math.max(rxScore, labScore, dischargeScore);
  if (max === 0) return "unknown";
  if (dischargeScore === max && dischargeScore > 0) return "discharge_summary";
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

  // Skip known non-data lines
  const skipPrefixes =
    /^(?:Page|Printed|Report|Date|Time|Order|Patient|MRN|Account|Insurance|Physician|Lab|Tel|Fax|CLIA|Address|Test Name|Parameter|Analyte|Component|Method|Flag|Units|Reference|Result|Specimen|Collected)/i;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.length > 250 || skipPrefixes.test(line)) continue;

    // Pattern 1: "Test Name   numeric_result   ..." (most common)
    let m = line.match(
      /^([A-Za-z][A-Za-z0-9 ()\-\/,\.%]{2,59}?)\s{2,}(\d+(?:\.\d+)?(?:\/\d+)?)\s/,
    );

    // Pattern 2: "Test Name   non-numeric result (Positive/Negative/Normal/Abnormal)"
    if (!m) {
      m = line.match(
        /^([A-Za-z][A-Za-z0-9 ()\-\/,\.%]{2,59}?)\s{2,}([A-Za-z]+(?:\s+[A-Za-z]+)?)\s/,
      );
    }

    // Pattern 3: More flexible - test name followed by any result with spaces
    if (!m) {
      m = line.match(
        /^([A-Za-z][A-Za-z0-9 ()\-\/,\.%]{2,59}?)\s{2,}(.+?)\s/,
      );
    }

    if (!m) continue;

    const testName = m[1].trim().replace(/\*+\s*$/, "").trim();
    let result = m[2].trim();

    // Clean up result - remove common non-result text
    result = result.replace(/^(?:Flag|Critical|High|Low|Abnormal|Normal)\s*/i, "");
    result = result.split(/\s{2,}/)[0].trim(); // Take first part if multiple spaces

    // Skip if result is too short or looks like a header
    if (result.length < 1 || result.length > 50) continue;
    if (/^(?:Page|Printed|Report|Date|Time|Order|Patient|MRN|Account|Insurance|Physician|Lab|Tel|Fax|CLIA|Address|Test Name|Parameter|Analyte|Component|Method|Flag|Units|Reference|Result|Specimen|Collected)$/i.test(result)) continue;

    // Extract everything after the result as a rough reference range
    const afterResult = line.slice(m[0].length).trim();
    // Try to find the reference range part (often "X – Y" or "< X" or "> X" or "X - Y")
    const rangeMatch = afterResult.match(/(\d[\d\s.–\-<>]+(?:\d|\w))/);
    const referenceRange = rangeMatch?.[1]?.trim() ?? "";

    if (
      testName.length >= 3 &&
      testName.length <= 80 &&
      !seen.has(testName.toLowerCase())
    ) {
      seen.add(testName.toLowerCase());
      results.push({ testName, result, referenceRange });
    }
  }

  return results;
}

export async function parseUploadedDocument(
  fileContent: string,
  mimeType?: string | null,
): Promise<ParsedDocument> {
  const empty: ParsedDocument = { type: "unknown", medications: [], labResults: [], rawText: "" };

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

  return { type, medications, labResults, rawText };
}
