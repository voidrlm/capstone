import { normalizePhraseSpacing } from "./helpers";

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

export function parsePrescriptionText(text: string, prescriptionDate: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const medications: ReturnType<typeof parseMedicationLine>[] = [];
  let doctorName = "";
  let doctorSpecialty = "";

  for (const line of lines) {
    const doctorResult = parseDoctorLine(line);
    if (doctorResult.doctorName) {
      doctorName = doctorResult.doctorName;
      doctorSpecialty = doctorResult.doctorSpecialty;
    }

    const medicationResult = parseMedicationLine(line, prescriptionDate);
    if (medicationResult) {
      medications.push(medicationResult);
    }
  }

  return {
    medications,
    doctorName,
    doctorSpecialty,
  };
}

export function parseLabResultText(text: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const labResults: { testName: string; result: string }[] = [];

  for (const line of lines) {
    const parts = line.split(/[;|:]/).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      labResults.push({
        testName: normalizePhraseSpacing(parts[0]),
        result: normalizePhraseSpacing(parts.slice(1).join("; ")),
      });
    }
  }

  return labResults;
}

export function parseDiagnosisText(text: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const diagnoses: string[] = [];

  for (const line of lines) {
    const cleaned = line.replace(/^(Diagnosis|Condition|Dx)\s*[A-Z0-9.-]*\s*:\s*/i, "").trim();
    if (cleaned) {
      diagnoses.push(normalizePhraseSpacing(cleaned));
    }
  }

  return diagnoses;
}
