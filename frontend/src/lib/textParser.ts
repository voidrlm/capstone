import { normalizePhraseSpacing, compactSpacedLine, compactSpacedChunks } from "./helpers";

export function formatDateForInput(value: string) {
  const compact = value.replace(/\s+/g, "").replace(/[^\d/]/g, "");
  const match = compact.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return "";
  }
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}

export function addDurationToDate(startDate: string, amount: number, unit: string) {
  if (!startDate) {
    return "";
  }
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const normalizedUnit = unit.toLowerCase();
  const days =
    normalizedUnit.startsWith("week") ? amount * 7
    : normalizedUnit.startsWith("month") ? amount * 30
    : amount;
  date.setDate(date.getDate() + Math.max(days - 1, 0));
  return date.toISOString().split("T")[0];
}

export function parseDoctorLine(value: string) {
  const cleaned = normalizePhraseSpacing(value).replace(/^(Prescriber|Physician|Clinician|Provider|Attending Physician|Ordering Provider)\s*:\s*/i, "").trim();
  if (!cleaned) {
    return { doctorName: "", doctorSpecialty: "" };
  }
  const [name, ...rest] = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    doctorName: name || "",
    doctorSpecialty: rest.join(", "),
  };
}

export function extractMedicationNameAndStrength(value: string) {
  const cleaned = normalizePhraseSpacing(value)
    .replace(/^(Rx|Medication)\s*[A-Z0-9.-]*\s*:\s*/i, "")
    .replace(/^\d+[\).\s-]+/, "")
    .trim();

  const strengthMatch = cleaned.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|mL|ml|units?|IU|%|percent)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|mcg|g|mL|ml))?(?:\s*(?:tablet|capsule|suspension|ointment|solution|patch|inhaler))?/i);
  const strength = strengthMatch ? normalizePhraseSpacing(strengthMatch[0]) : "";
  const medicationName = normalizePhraseSpacing(
    strengthMatch ? cleaned.slice(0, strengthMatch.index).trim().replace(/[,;:]$/, "") : cleaned,
  );

  return {
    medicationName: medicationName || normalizePhraseSpacing(cleaned.split(/[;|]/)[0] || ""),
    strength,
  };
}

export function parseMedicationLine(line: string, prescriptionDate: string) {
  const normalizedLine = normalizePhraseSpacing(line);
  const parts = normalizedLine.split(/[;|]/).map((part) => normalizePhraseSpacing(part)).filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  const head = extractMedicationNameAndStrength(parts[0]);
  if (!head.medicationName) {
    return null;
  }

  const durationSource = parts.join("; ");
  const durationMatch = durationSource.match(/\bfor\s+(\d+)\s+(day|days|week|weeks|month|months)\b/i);
  const endDate = durationMatch
    ? addDurationToDate(prescriptionDate, Number(durationMatch[1]), durationMatch[2])
    : "";

  const dosageAmount = normalizePhraseSpacing(
    parts.find((part, index) => index > 0 && !/\bfor\s+\d+\s+(?:day|days|week|weeks|month|months)\b/i.test(part) && !/\bafter\b|\bwith\b|\bbefore\b|\bas needed\b|\bmorning\b|\bevening\b|\bnightly\b|\bbedtime\b/i.test(part))
    || parts.find((part, index) => index > 0 && !/\bfor\s+\d+\s+(?:day|days|week|weeks|month|months)\b/i.test(part))
    || "",
  );

  const notes = parts
    .slice(1)
    .filter((part) => part !== dosageAmount)
    .filter((part) => !/\bfor\s+\d+\s+(?:day|days|week|weeks|month|months)\b/i.test(part))
    .filter(Boolean)
    .join("; ");

  return {
    medicationName: head.medicationName,
    dosageAmount,
    startDate: prescriptionDate,
    endDate,
    notes,
  };
}

export function parsePrescriptionText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => normalizePhraseSpacing(compactSpacedLine(line)))
    .filter(Boolean);
  const normalized = compactSpacedChunks(lines.join(" "));
  const dateMatch =
    normalized.match(/(?:Date\s+Prescribed|Prescription\s+Date|Date\s+Written|Date)\s*[:\-]?\s*([0-9\s/]{6,24})/i) ||
    normalized.match(/([0-9]\s*[0-9]?\s*\/\s*[0-9]\s*[0-9]?\s*\/\s*[0-9](?:\s*[0-9]){3})/);
  const prescriptionDate = dateMatch ? formatDateForInput(dateMatch[1]) : "";

  const doctorLine = lines.find((line) => /^(Prescriber|Physician|Clinician|Provider|Attending Physician|Ordering Provider)\s*:/i.test(line));
  const { doctorName, doctorSpecialty } = parseDoctorLine(doctorLine || "");

  const medicationLines = lines.filter((line) =>
    /^(\d+[\).\s-]+|Rx\s*\d*:?|Medication\s*[A-Z0-9.-]*:)/i.test(line) ||
    /\b(?:mg|mcg|g|mL|ml|units?|IU|%|percent)\b/i.test(line),
  ).filter((line) =>
    !/^(Patient|DOB|MRN|Account|Record|Encounter|Date|Date Prescribed|Prescription Date|Prescriber|Physician|Clinician|Provider|Instructions|Notes|Monitoring|Comment|Care Advice|Parent Instructions|Additional Instructions|Counseling|Signature|Ordering Clinician)/i.test(line),
  );

  const medications = medicationLines
    .map((line) => parseMedicationLine(line, prescriptionDate))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (medications.length === 0) {
    const medicationBlocks = Array.from(normalized.matchAll(/\[([^\]]+)\]/g), (match) => match[1].trim());
    medicationBlocks.forEach((block) => {
      const parsed = parseMedicationLine(block, prescriptionDate);
      if (parsed) {
        medications.push(parsed);
      }
    });
  }

  return {
    prescriptionDate,
    doctorName,
    doctorSpecialty,
    medications,
  };
}

export function parseLabResultText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => normalizePhraseSpacing(compactSpacedLine(line)))
    .filter(Boolean);

  const joined = lines.join(" ");
  const dateMatch =
    joined.match(/(?:Collection Date|Collected|Collection|Reported|Resulted)\s*[:\-]?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i)
    || joined.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/);

  const reportDate = dateMatch ? formatDateForInput(dateMatch[1]) : "";

  const headerLines = lines.filter((line) =>
    !/^(Patient|DOB|Accession|Collection Date|Collected|Collection|Reported|Resulted|Ordering Clinician|Ordering Provider|Interpretation|Comment|Assessment|Clinical Note|Recommendations|Plan)/i.test(line),
  );

  const metricLines = lines.filter((line) =>
    /:\s*.+/.test(line)
    && !/^(Patient|DOB|Accession|Collection Date|Collected|Collection|Reported|Resulted|Ordering Clinician|Ordering Provider|Interpretation|Comment|Assessment|Clinical Note|Recommendations|Plan)/i.test(line),
  );

  const summaryLines = lines.filter((line) =>
    /^(Interpretation|Comment|Assessment|Clinical Note|Recommendations|Plan)\s*:/i.test(line),
  );

  const testName =
    headerLines.find((line) => !/:\s*.+/.test(line))
    || metricLines[0]?.split(":")[0]?.trim()
    || "";

  const result = [...metricLines, ...summaryLines]
    .map((line) => normalizePhraseSpacing(line))
    .join("\n");

  return [{
    testName: normalizePhraseSpacing(testName),
    result,
    date: reportDate,
  }];
}

export function parseDiagnosisText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => normalizePhraseSpacing(compactSpacedLine(line)))
    .filter(Boolean);

  const joined = lines.join(" ");
  const dateMatch =
    joined.match(/(?:Date of Diagnosis|Diagnosis Date|Date Diagnosed|Date)\s*[:\-]?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i)
    || joined.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/);

  const diagnosisDate = dateMatch ? formatDateForInput(dateMatch[1]) : "";

  const primaryDiagnosisLine =
    lines.find((line) => /^Primary Diagnosis\s*:/i.test(line))
    || lines.find((line) => /^Diagnosis\s*:/i.test(line))
    || lines.find((line) => /^Clinical Impression\s*:/i.test(line));

  const diagnosisName = primaryDiagnosisLine
    ? normalizePhraseSpacing(primaryDiagnosisLine.replace(/^(Primary Diagnosis|Diagnosis|Clinical Impression)\s*:\s*/i, ""))
    : normalizePhraseSpacing(
        lines.find((line) =>
          !/^(Patient|DOB|Encounter|Date of Diagnosis|Diagnosis Date|Date Diagnosed|Diagnosing Clinician|Secondary Diagnosis|Assessment|Plan|Recommendations|Treatment|Provider Note|Pediatric Note|Summary|Comment|Advice|Impression)/i.test(line),
        ) || "",
      );

  return [{
    diagnosisName,
    date: diagnosisDate,
  }];
}
