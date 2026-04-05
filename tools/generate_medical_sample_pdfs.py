from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from textwrap import wrap


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "frontend" / "public" / "sample_documents"


@dataclass
class PdfPage:
    title: str
    subtitle: str
    lines: list[str]
    template: int


def escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_text_stream(page: PdfPage) -> str:
    text_lines: list[tuple[str, int, int]] = []

    if page.template == 0:
      title_x, title_y = 56, 760
      subtitle_x, subtitle_y = 56, 736
      body_x, body_start_y, leading = 56, 700, 20
    elif page.template == 1:
      title_x, title_y = 70, 770
      subtitle_x, subtitle_y = 70, 748
      body_x, body_start_y, leading = 70, 706, 18
    elif page.template == 2:
      title_x, title_y = 54, 758
      subtitle_x, subtitle_y = 54, 734
      body_x, body_start_y, leading = 54, 694, 19
    elif page.template == 3:
      title_x, title_y = 64, 766
      subtitle_x, subtitle_y = 64, 740
      body_x, body_start_y, leading = 64, 702, 18
    else:
      title_x, title_y = 60, 762
      subtitle_x, subtitle_y = 60, 738
      body_x, body_start_y, leading = 60, 698, 19

    text_lines.append((page.title, title_x, title_y))
    text_lines.append((page.subtitle, subtitle_x, subtitle_y))

    current_y = body_start_y
    for raw_line in page.lines:
        wrapped = wrap(raw_line, width=88) or [""]
        for line in wrapped:
            text_lines.append((line, body_x, current_y))
            current_y -= leading
        current_y -= 4

    chrome_ops = build_template_chrome(page.template)
    operations = [*chrome_ops, "BT", "/F1 20 Tf", "0.1 0.14 0.22 rg"]
    title, x, y = text_lines[0]
    operations.append(f"1 0 0 1 {x} {y} Tm ({escape_pdf_text(title)}) Tj")
    subtitle, x, y = text_lines[1]
    operations.extend(["/F2 10 Tf", "0.35 0.43 0.55 rg", f"1 0 0 1 {x} {y} Tm ({escape_pdf_text(subtitle)}) Tj"])
    operations.extend(["/F1 11 Tf", "0.18 0.23 0.31 rg"])
    for text, x, y in text_lines[2:]:
        operations.append(f"1 0 0 1 {x} {y} Tm ({escape_pdf_text(text)}) Tj")
    operations.append("ET")
    return "\n".join(operations)


def build_template_chrome(template: int) -> list[str]:
    chrome = {
        0: [
            "0.95 0.97 1 rg 36 724 540 42 re f",
            "0.82 0.88 0.97 RG 1.2 w 36 724 540 42 re S",
            "0.90 0.94 0.98 rg 36 88 540 620 re f",
        ],
        1: [
            "0.93 0.97 0.95 rg 36 720 540 46 re f",
            "0.67 0.80 0.74 RG 1.2 w 36 720 540 46 re S",
            "0.96 0.98 0.97 rg 36 88 540 620 re f",
        ],
        2: [
            "0.98 0.95 0.92 rg 36 724 540 42 re f",
            "0.92 0.76 0.60 RG 1.2 w 36 724 540 42 re S",
            "0.99 0.98 0.96 rg 36 88 540 620 re f",
        ],
        3: [
            "0.95 0.94 0.99 rg 36 722 540 44 re f",
            "0.78 0.72 0.94 RG 1.2 w 36 722 540 44 re S",
            "0.98 0.97 1.00 rg 36 88 540 620 re f",
        ],
        4: [
            "0.94 0.98 0.98 rg 36 722 540 44 re f",
            "0.59 0.78 0.77 RG 1.2 w 36 722 540 44 re S",
            "0.97 0.99 0.99 rg 36 88 540 620 re f",
        ],
    }
    return chrome.get(template, chrome[0]) + [
        "0.86 0.90 0.95 RG 0.8 w 36 88 540 620 re S",
        "0.82 0.86 0.91 RG 0.8 w 36 120 m 576 120 l S",
    ]


def write_pdf(path: Path, page: PdfPage) -> None:
    stream = build_text_stream(page).encode("latin-1", errors="replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
        f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ]

    buffer = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets: list[int] = []
    for idx, obj in enumerate(objects, start=1):
        offsets.append(len(buffer))
        buffer.extend(f"{idx} 0 obj\n".encode("latin-1"))
        buffer.extend(obj)
        buffer.extend(b"\nendobj\n")

    xref_offset = len(buffer)
    buffer.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    buffer.extend(b"0000000000 65535 f \n")
    for offset in offsets:
        buffer.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))
    buffer.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("latin-1")
    )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buffer)


prescription_pages = [
    PdfPage(
        title="Riverside Family Care",
        subtitle="Outpatient Prescription Order  |  Riverside Clinic  |  Tel: (617) 555-2400",
        lines=[
            "Patient Name: Olivia Carter    DOB: 03/14/1989    MRN: RX-1001",
            "Date Prescribed: 04/15/2033",
            "Prescriber: Dr. Hannah Brooks, Internal Medicine",
            "Department: Adult Primary Care",
            "Rx 1: Gentamicin 500 mg; Once A Day; After Meal; for 14 days",
            "Rx 2: Moxifloxacin 400 mg; Once A Day; Morning; for 10 days",
            "Rx 3: Naproxen 250 mg; Twice Daily; As Needed for pain; for 7 days",
            "Instructions: Return for renal function check in 7 days. Hydrate well during therapy.",
            "Signature: Hannah Brooks, MD",
        ],
        template=0,
    ),
    PdfPage(
        title="Mercy Downtown Practice",
        subtitle="Ambulatory Medication Order  |  Cardiology Service",
        lines=[
            "Patient Name: Samuel Price    DOB: 11/09/1975    Account: RX-1002",
            "Prescription Date: 03/21/2033",
            "Physician: Dr. Irene Patel, Cardiology",
            "Medication A: Rosuvastatin 20 mg; Nightly; for 30 days",
            "Medication B: Lisinopril 10 mg; Once A Day; Morning; for 30 days",
            "Medication C: Aspirin 81 mg; Once A Day; With Food; for 30 days",
            "Notes: Check blood pressure log and report dizziness or muscle pain.",
        ],
        template=1,
    ),
    PdfPage(
        title="North Harbor Medical Center",
        subtitle="Hospital Discharge Medication Reconciliation",
        lines=[
            "Patient Name: Abigail Nguyen    DOB: 07/02/1994    MRN: RX-1003",
            "Date Written: 02/11/2033",
            "Clinician: Dr. Omar Aziz, Infectious Disease",
            "1. Amoxicillin-Clavulanate 875 mg / 125 mg; Twice Daily; After Meal; for 14 days",
            "2. Fluconazole 150 mg; One Dose Weekly; for 4 weeks",
            "3. Ondansetron 4 mg; Every 8 Hours As Needed; for 5 days",
            "Additional Instructions: Follow up if fever persists longer than 48 hours.",
        ],
        template=2,
    ),
    PdfPage(
        title="Oakline Primary Health",
        subtitle="Medication Refill and New Orders  |  Chronic Disease Clinic",
        lines=[
            "Patient Name: Ethan Wallace    DOB: 09/17/1968    Chart: RX-1004",
            "Date Prescribed: 05/09/2033",
            "Prescriber: Dr. Naomi Rivera, Family Medicine",
            "Rx 1: Metformin ER 500 mg; Twice Daily; With Breakfast and Dinner; for 90 days",
            "Rx 2: Glimepiride 2 mg; Once A Day; Before Breakfast; for 90 days",
            "Rx 3: Levothyroxine 75 mcg; Once A Day; Empty Stomach; for 90 days",
            "Monitoring: Repeat HbA1c and TSH in 12 weeks.",
        ],
        template=3,
    ),
    PdfPage(
        title="Crescent Specialty Clinic",
        subtitle="Neurology Medication Plan",
        lines=[
            "Patient Name: Mia Johnson    DOB: 01/23/2001    Episode: RX-1005",
            "Date Prescribed: 06/01/2033",
            "Prescriber: Dr. Keith Morgan, Neurology",
            "Medication 1: Lamotrigine 25 mg; Once A Day; Evening; for 14 days",
            "Medication 2: Lamotrigine 50 mg; Once A Day; Evening; for 14 days after first course",
            "Medication 3: Clonazepam 0.5 mg; Once At Bedtime; As Needed for breakthrough symptoms; for 10 days",
            "Note: Avoid abrupt discontinuation. Review rash precautions with patient.",
        ],
        template=4,
    ),
    PdfPage(
        title="Harborview Community Hospital",
        subtitle="Discharge Prescription",
        lines=[
            "Patient: Daniel Ortiz    DOB: 05/12/1957    MRN: RX-1006",
            "Date Prescribed: 01/18/2033",
            "Prescriber: Dr. Felicia Grant, Pulmonology",
            "Prednisone 20 mg; Once A Day; Morning; for 5 days",
            "Albuterol Inhaler 90 mcg; Two Puffs Every 6 Hours As Needed; for 30 days",
            "Doxycycline 100 mg; Twice Daily; for 7 days",
            "Comment: Continue home inhaled corticosteroid. Seek care for worsening shortness of breath.",
        ],
        template=0,
    ),
    PdfPage(
        title="Silver Pines Women’s Health",
        subtitle="Office Prescription Record",
        lines=[
            "Patient: Rachel Kim    DOB: 12/30/1986    Record: RX-1007",
            "Date Prescribed: 07/22/2033",
            "Prescriber: Dr. Laura Simmons, Obstetrics and Gynecology",
            "Nitrofurantoin 100 mg; Twice Daily; With Food; for 5 days",
            "Phenazopyridine 200 mg; Three Times Daily; After Meal; for 2 days",
            "Fluconazole 150 mg; Single Dose If Symptoms Persist; for 1 day",
            "Instructions: Increase fluids and return if flank pain or fever develops.",
        ],
        template=1,
    ),
    PdfPage(
        title="Summit Behavioral Health",
        subtitle="Medication Initiation Plan",
        lines=[
            "Patient: Tyler Reed    DOB: 08/06/1990    Case: RX-1008",
            "Date Prescribed: 08/03/2033",
            "Prescriber: Dr. Sofia Herrera, Psychiatry",
            "Sertraline 25 mg; Once A Day; Morning; for 7 days",
            "Sertraline 50 mg; Once A Day; Morning; for 30 days after titration",
            "Hydroxyzine 25 mg; Every 8 Hours As Needed for anxiety; for 14 days",
            "Counseling: Review sedation precautions and mood follow-up in 2 weeks.",
        ],
        template=2,
    ),
    PdfPage(
        title="Willow Creek Urgent Care",
        subtitle="Urgent Care Medication Sheet",
        lines=[
            "Patient: Nora Bennett    DOB: 10/19/1979    Visit: RX-1009",
            "Date Prescribed: 09/14/2033",
            "Clinician: Dr. Michael Tran, Emergency Medicine",
            "Cephalexin 500 mg; Four Times Daily; for 7 days",
            "Ibuprofen 600 mg; Every 8 Hours As Needed; for 5 days",
            "Mupirocin 2 percent ointment; Apply Three Times Daily; for 7 days",
            "Care Advice: Wound recheck in 48 hours if redness spreads.",
        ],
        template=3,
    ),
    PdfPage(
        title="Elm Street Pediatrics",
        subtitle="Pediatric Prescription Authorization",
        lines=[
            "Patient: Lucas Harris    DOB: 04/08/2026    ID: RX-1010",
            "Date Prescribed: 11/05/2033",
            "Prescriber: Dr. Priya Das, Pediatrics",
            "Amoxicillin 400 mg/5 mL suspension; 6 mL Twice Daily; for 10 days",
            "Acetaminophen 160 mg/5 mL; 7 mL Every 6 Hours As Needed; for 3 days",
            "Oral Rehydration Solution; Small Frequent Sips; for 2 days",
            "Parent Instructions: Call if fever lasts over 72 hours or breathing worsens.",
        ],
        template=4,
    ),
]

lab_pages = [
    PdfPage("North Harbor Diagnostics", "Comprehensive Metabolic Panel Report", [
        "Patient: Olivia Carter    DOB: 03/14/1989    Accession: LAB-2001",
        "Collection Date: 04/21/2033    Reported: 04/21/2033 15:12",
        "Ordering Clinician: Dr. Hannah Brooks",
        "Creatinine: 1.34 mg/dL  High   Reference: 0.50 - 1.10 mg/dL",
        "BUN: 24 mg/dL  High   Reference: 7 - 20 mg/dL",
        "Potassium: 5.4 mmol/L  High   Reference: 3.5 - 5.1 mmol/L",
        "Interpretation: Mild renal impairment with borderline hyperkalemia. Correlate clinically with medication list.",
    ], 0),
    PdfPage("Mercy Downtown Laboratory", "Lipid Panel", [
        "Patient: Samuel Price    DOB: 11/09/1975    Accession: LAB-2002",
        "Collection Date: 03/28/2033    Reported: 03/28/2033 09:44",
        "Ordering Clinician: Dr. Irene Patel",
        "Total Cholesterol: 212 mg/dL  Borderline High",
        "LDL Cholesterol: 138 mg/dL  High",
        "HDL Cholesterol: 41 mg/dL  Low",
        "Triglycerides: 198 mg/dL  High",
        "Comment: Recommend dietary counseling and repeat panel in 12 weeks after therapy adjustment.",
    ], 1),
    PdfPage("Riverside Clinical Lab", "Hemoglobin A1c", [
        "Patient: Ethan Wallace    DOB: 09/17/1968    Accession: LAB-2003",
        "Collected: 05/10/2033 08:03    Resulted: 05/10/2033 13:06",
        "Ordering Clinician: Dr. Naomi Rivera",
        "Hemoglobin A1c: 8.4 percent  High   Reference: 4.0 - 5.6 percent",
        "Estimated Average Glucose: 194 mg/dL",
        "Interpretation: Diabetes remains above target. Review adherence and consider medication escalation.",
    ], 2),
    PdfPage("Oakline Pathology", "Thyroid Function Panel", [
        "Patient: Rachel Kim    DOB: 12/30/1986    Accession: LAB-2004",
        "Collection Date: 07/26/2033",
        "TSH: 6.84 uIU/mL  High",
        "Free T4: 0.77 ng/dL  Low",
        "Assessment: Consistent with primary hypothyroidism. Clinical correlation recommended.",
    ], 3),
    PdfPage("Harborview Community Hospital Lab", "Complete Blood Count", [
        "Patient: Daniel Ortiz    DOB: 05/12/1957    Accession: LAB-2005",
        "Collected: 01/22/2033 07:55",
        "WBC: 13.8 x10^3/uL  High",
        "Hemoglobin: 12.4 g/dL  Low",
        "Platelets: 264 x10^3/uL  Normal",
        "Neutrophils: 82 percent  High",
        "Interpretation: Leukocytosis with neutrophilia suggesting active bacterial infection.",
    ], 4),
    PdfPage("Summit Behavioral Health Labs", "Medication Monitoring Panel", [
        "Patient: Tyler Reed    DOB: 08/06/1990    Accession: LAB-2006",
        "Collected: 08/10/2033",
        "AST: 62 U/L  High",
        "ALT: 71 U/L  High",
        "Sodium: 139 mmol/L  Normal",
        "Lithium: 0.8 mmol/L  Therapeutic",
        "Comment: Mild transaminitis. Repeat liver enzymes in 2 weeks.",
    ], 0),
    PdfPage("Silver Pines Diagnostic Center", "Urinalysis", [
        "Patient: Mia Johnson    DOB: 01/23/2001    Accession: LAB-2007",
        "Collected: 06/03/2033",
        "Leukocyte Esterase: Positive",
        "Nitrite: Positive",
        "WBC: >50 per HPF",
        "Bacteria: Moderate",
        "Interpretation: Findings support urinary tract infection.",
    ], 1),
    PdfPage("Elm Street Pediatric Lab", "Respiratory Viral Panel", [
        "Patient: Lucas Harris    DOB: 04/08/2026    Accession: LAB-2008",
        "Collected: 11/06/2033",
        "RSV PCR: Detected",
        "Influenza A PCR: Not Detected",
        "Influenza B PCR: Not Detected",
        "SARS-CoV-2 PCR: Not Detected",
        "Comment: Supportive care recommended. Monitor hydration and work of breathing.",
    ], 2),
    PdfPage("Crescent Specialty Diagnostics", "Lamotrigine Safety Monitoring", [
        "Patient: Nora Bennett    DOB: 10/19/1979    Accession: LAB-2009",
        "Collected: 09/18/2033",
        "CBC: Within normal limits",
        "ALT: 32 U/L  Normal",
        "AST: 28 U/L  Normal",
        "Comment: No current laboratory contraindication to continued therapy.",
    ], 3),
    PdfPage("Willow Creek Lab Services", "Basic Metabolic Panel", [
        "Patient: Abigail Nguyen    DOB: 07/02/1994    Accession: LAB-2010",
        "Collected: 02/15/2033",
        "Glucose: 102 mg/dL  Borderline",
        "Sodium: 140 mmol/L  Normal",
        "Potassium: 4.2 mmol/L  Normal",
        "Bicarbonate: 21 mmol/L  Low",
        "Creatinine: 0.79 mg/dL  Normal",
        "Clinical Note: Mild low bicarbonate, otherwise unremarkable chemistry profile.",
    ], 4),
]

diagnosis_pages = [
    PdfPage("North Harbor Medical Center", "Clinical Diagnosis Summary", [
        "Patient: Olivia Carter    DOB: 03/14/1989    Encounter: DX-3001",
        "Date of Diagnosis: 04/21/2033",
        "Diagnosing Clinician: Dr. Hannah Brooks",
        "Primary Diagnosis: Drug-induced acute kidney injury",
        "Secondary Diagnosis: Hyperkalemia",
        "Assessment: Renal function decline likely associated with concurrent aminoglycoside and NSAID exposure.",
        "Plan: Stop nephrotoxic agents, repeat BMP in 48 hours, nephrology follow-up.",
    ], 0),
    PdfPage("Mercy Downtown Practice", "Provider Diagnosis Note", [
        "Patient: Samuel Price    DOB: 11/09/1975    Encounter: DX-3002",
        "Date of Diagnosis: 03/28/2033",
        "Primary Diagnosis: Mixed hyperlipidemia",
        "Secondary Diagnosis: Essential hypertension",
        "Clinical Impression: Persistent elevation of LDL and triglycerides despite diet modification.",
        "Management: Intensify statin therapy and review home blood pressure log.",
    ], 1),
    PdfPage("Oakline Primary Health", "Assessment and Diagnosis", [
        "Patient: Ethan Wallace    DOB: 09/17/1968    Encounter: DX-3003",
        "Date of Diagnosis: 05/10/2033",
        "Primary Diagnosis: Type 2 diabetes mellitus with hyperglycemia",
        "Secondary Diagnosis: Suboptimal glycemic control",
        "Provider Note: HbA1c remains above goal. Education reinforced and medication review completed.",
    ], 2),
    PdfPage("Silver Pines Women’s Health", "Gynecology Diagnosis Report", [
        "Patient: Rachel Kim    DOB: 12/30/1986    Encounter: DX-3004",
        "Date of Diagnosis: 07/26/2033",
        "Primary Diagnosis: Primary hypothyroidism",
        "Secondary Diagnosis: Fatigue",
        "Impression: Biochemical hypothyroidism with elevated TSH and low free T4.",
        "Recommendations: Restart levothyroxine and recheck thyroid function in 6 to 8 weeks.",
    ], 3),
    PdfPage("Harborview Community Hospital", "Hospitalist Diagnosis Note", [
        "Patient: Daniel Ortiz    DOB: 05/12/1957    Encounter: DX-3005",
        "Date of Diagnosis: 01/22/2033",
        "Primary Diagnosis: Community-acquired pneumonia",
        "Secondary Diagnosis: COPD exacerbation",
        "Assessment: Productive cough, leukocytosis, and imaging consistent with lower lobe infiltrate.",
        "Plan: Continue antibiotics, inhaled bronchodilators, and follow-up chest imaging.",
    ], 4),
    PdfPage("Summit Behavioral Health", "Psychiatric Assessment Diagnosis", [
        "Patient: Tyler Reed    DOB: 08/06/1990    Encounter: DX-3006",
        "Date of Diagnosis: 08/03/2033",
        "Primary Diagnosis: Generalized anxiety disorder",
        "Secondary Diagnosis: Insomnia",
        "Summary: Ongoing excessive worry with sleep disruption and functional impairment at work.",
        "Plan: Initiate SSRI, short-term hydroxyzine, and psychotherapy referral.",
    ], 0),
    PdfPage("Crescent Specialty Clinic", "Neurology Diagnostic Impression", [
        "Patient: Mia Johnson    DOB: 01/23/2001    Encounter: DX-3007",
        "Date of Diagnosis: 06/01/2033",
        "Primary Diagnosis: Focal seizure disorder",
        "Secondary Diagnosis: Breakthrough nocturnal episodes",
        "Comment: Symptoms remain consistent with seizure recurrence after inconsistent medication use.",
    ], 1),
    PdfPage("Willow Creek Urgent Care", "Urgent Care Diagnosis Summary", [
        "Patient: Nora Bennett    DOB: 10/19/1979    Encounter: DX-3008",
        "Date of Diagnosis: 09/14/2033",
        "Primary Diagnosis: Cellulitis of right lower leg",
        "Secondary Diagnosis: Local soft tissue infection",
        "Assessment: Expanding erythema with warmth and tenderness; no fluctuance present.",
        "Advice: Start oral antibiotics and return if fever or streaking develops.",
    ], 2),
    PdfPage("Elm Street Pediatrics", "Pediatric Diagnosis Sheet", [
        "Patient: Lucas Harris    DOB: 04/08/2026    Encounter: DX-3009",
        "Date of Diagnosis: 11/06/2033",
        "Primary Diagnosis: Respiratory syncytial virus infection",
        "Secondary Diagnosis: Mild dehydration risk",
        "Pediatric Note: Positive RSV with mild increased work of breathing and reduced intake.",
        "Plan: Home monitoring, nasal suctioning, hydration, and return precautions reviewed.",
    ], 3),
    PdfPage("Riverside Family Care", "Office Diagnosis Summary", [
        "Patient: Abigail Nguyen    DOB: 07/02/1994    Encounter: DX-3010",
        "Date of Diagnosis: 02/15/2033",
        "Primary Diagnosis: Acute uncomplicated cystitis",
        "Secondary Diagnosis: Dysuria",
        "Assessment: Urinalysis positive for nitrites and leukocyte esterase with classic urinary symptoms.",
        "Treatment: Oral antibiotic course and supportive hydration instructions.",
    ], 4),
]


def main() -> None:
    datasets = {
        "prescriptions": prescription_pages,
        "lab_results": lab_pages,
        "diagnoses": diagnosis_pages,
    }
    file_prefixes = {
        "prescriptions": "prescription",
        "lab_results": "lab_result",
        "diagnoses": "diagnosis",
    }

    for group, pages in datasets.items():
        group_dir = OUTPUT_ROOT / group
        group_dir.mkdir(parents=True, exist_ok=True)
        for index, page in enumerate(pages, start=1):
            file_name = f"{file_prefixes[group]}_{index:02d}.pdf"
            write_pdf(group_dir / file_name, page)

    manifest = OUTPUT_ROOT / "README.md"
    manifest.write_text(
        "\n".join([
            "# Sample Medical PDFs",
            "",
            "Generated sample sets:",
            "- 10 prescriptions",
            "- 10 lab results",
            "- 10 diagnoses",
            "",
            "Folders:",
            "- `prescriptions/`",
            "- `lab_results/`",
            "- `diagnoses/`",
        ]),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
